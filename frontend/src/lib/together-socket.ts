import { io, type Socket } from "socket.io-client";

export function togetherSocket(): Socket {
  const url =
    process.env.NEXT_PUBLIC_WS_URL?.trim() ||
    (typeof window !== "undefined" && window.location.port === "3100" ? "http://127.0.0.1:4100" : undefined);
  return io(`${url ?? ""}/together`, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true
  });
}
