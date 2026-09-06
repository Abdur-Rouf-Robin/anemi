import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { ACCESS_COOKIE } from "../auth/auth.constants";
import { AuthService } from "../auth/auth.service";
import type { AuthUser } from "../auth/auth.types";
import { corsOriginSetting } from "../security/cors-origins";
import { TogetherService } from "./together.service";

type SocketData = {
  user: AuthUser | null;
  code?: string;
};

@WebSocketGateway({
  namespace: "/together",
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const setting = corsOriginSetting();
      if (setting === true || !origin) {
        callback(null, true);
        return;
      }
      callback(null, Array.isArray(setting) && setting.includes(origin));
    },
    credentials: true
  },
  transports: ["websocket"]
})
export class TogetherGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly log = new Logger(TogetherGateway.name);

  constructor(
    private readonly together: TogetherService,
    private readonly auth: AuthService
  ) {}

  async handleConnection(client: Socket) {
    client.data.user = await this.readUser(client);
  }

  async handleDisconnect(client: Socket) {
    const code = (client.data as SocketData).code;
    if (code) await this.emitPresence(code);
  }

  @SubscribeMessage("join")
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: { code?: string }) {
    const code = String(body?.code ?? "").trim().toLowerCase();
    if (!code) return { error: "Room code required" };
    try {
      const room = await this.together.get(code);
      if ((client.data as SocketData).code) {
        await client.leave((client.data as SocketData).code as string);
      }
      await client.join(code);
      (client.data as SocketData).code = code;
      await this.emitPresence(code);
      return { room };
    } catch (err) {
      this.log.debug(`join failed: ${err instanceof Error ? err.message : "unknown"}`);
      return { error: "Room not found" };
    }
  }

  @SubscribeMessage("sync")
  async sync(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { positionSec?: number; playing?: boolean }
  ) {
    const data = client.data as SocketData;
    if (!data.user || !data.code) return { error: "Sign in as the host to sync" };
    try {
      const next = await this.together.sync(
        data.user.id,
        data.code,
        Number(body?.positionSec ?? 0),
        Boolean(body?.playing)
      );
      client.to(data.code).emit("sync", {
        positionSec: next.positionSec,
        playing: next.playing
      });
      return { ok: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not sync" };
    }
  }

  @SubscribeMessage("chat")
  async chat(@ConnectedSocket() client: Socket, @MessageBody() body: { body?: string }) {
    const data = client.data as SocketData;
    const text = String(body?.body ?? "").trim();
    if (!data.user || !data.code || !text) return { error: "Sign in to chat" };
    try {
      const message = await this.together.chat(data.user.id, data.code, text);
      this.server.to(data.code).emit("chat", message);
      return { ok: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not chat" };
    }
  }

  private async emitPresence(code: string) {
    const sockets = await this.server.in(code).fetchSockets();
    this.server.to(code).emit("presence", {
      count: sockets.length,
      viewers: sockets.map((socket) => {
        const user = (socket.data as SocketData).user;
        return user?.displayName ?? "Guest";
      })
    });
  }

  private readUser(client: Socket) {
    const header = client.handshake.headers.cookie;
    if (!header) return Promise.resolve(null);
    const token = cookieValue(header, ACCESS_COOKIE);
    if (!token) return Promise.resolve(null);
    return this.auth.userFromToken(token);
  }
}

function cookieValue(header: string, name: string) {
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}
