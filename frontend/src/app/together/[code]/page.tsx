"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { MediaPlayer } from "@/components/player/media-player";
import { PageIntro } from "@/components/page-intro";
import { ShareButton } from "@/components/share-button";
import { useSession } from "@/components/session-provider";
import { togetherSocket } from "@/lib/together-socket";

type ChatItem = { id: string; body: string; displayName: string };
type Room = {
  code: string;
  hostId: string;
  hostName: string;
  positionSec: number;
  playing: boolean;
  episode: {
    id: string;
    name: string;
    number: number;
    videoUrl: string | null;
    subtitleUrl?: string | null;
    durationSec?: number | null;
    audioKind?: "SUB" | "DUB";
    introStartSec?: number | null;
    introEndSec?: number | null;
    outroStartSec?: number | null;
    season: { number: number; title: { name: string; slug: string } };
  };
  messages: ChatItem[];
};

export default function TogetherRoomPage() {
  const { user } = useSession();
  const { code } = useParams<{ code: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const applying = useRef(false);
  const meIdRef = useRef<string | null>(null);
  const hostRef = useRef(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [viewers, setViewers] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const socket = togetherSocket();
    socketRef.current = socket;

    function applySync(positionSec: number, playing: boolean) {
      const node = videoRef.current;
      if (!node) return;
      applying.current = true;
      if (Math.abs(node.currentTime - positionSec) > 1.2) node.currentTime = positionSec;
      if (playing && node.paused) void node.play().catch(() => undefined);
      if (!playing && !node.paused) node.pause();
      window.setTimeout(() => {
        applying.current = false;
      }, 280);
    }

    socket.on("connect", () => {
      setLive(true);
      meIdRef.current = user?.id ?? null;
      if (!cancelled) {
          socket.emit("join", { code }, (res: { room?: Room; error?: string }) => {
            if (res?.error || !res.room) {
              setError(res?.error || "Room not found");
              return;
            }
            const host = Boolean(meIdRef.current && res.room.hostId === meIdRef.current);
            hostRef.current = host;
            setIsHost(host);
            setRoom(res.room);
            setError("");
            window.setTimeout(() => applySync(res.room!.positionSec, res.room!.playing), 80);
          });
      }
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("sync", (payload: { positionSec: number; playing: boolean }) => {
      if (hostRef.current) return;
      applySync(payload.positionSec, payload.playing);
      setRoom((prev) => (prev ? { ...prev, ...payload } : prev));
    });
    socket.on("chat", (message: ChatItem) => {
      setRoom((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    });
    socket.on("presence", (payload: { viewers?: string[] }) => {
      setViewers(payload.viewers ?? []);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, user?.id]);

  function sendSync(positionSec: number, playing: boolean) {
    if (!hostRef.current || applying.current) return;
    socketRef.current?.emit("sync", { positionSec, playing });
  }

  useEffect(() => {
    if (!room || !isHost) return;
    const timer = window.setInterval(() => {
      const node = videoRef.current;
      if (!node || applying.current) return;
      sendSync(Math.floor(node.currentTime), !node.paused);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [room, isHost]);

  if (error && !room) return <p className="px-4 py-10 text-sm text-red-400">{error}</p>;
  if (!room) return <p className="px-4 py-10 text-sm text-muted">Connecting to room…</p>;

  const titleName = room.episode.season.title.name;

  return (
    <main className="watch-shell py-4 pb-8 sm:py-6">
      <PageIntro
        kicker={`Room ${room.code} · ${live ? "Live" : "Reconnecting"}`}
        title={`${titleName} · E${room.episode.number}`}
        blurb={
          isHost
            ? `You are the host. Others follow your playhead.${viewers.length ? ` ${viewers.length} in room.` : ""}`
            : `Following ${room.hostName}.${viewers.length ? ` ${viewers.length} in room.` : ""}`
        }
        actions={<ShareButton title={`Watch together · ${titleName}`} />}
      />
      <div className="mt-5">
        <MediaPlayer
          episodeId={room.episode.id}
          title={titleName}
          episodeName={`E${room.episode.number} · ${room.episode.name}`}
          src={room.episode.videoUrl}
          durationSec={room.episode.durationSec}
          introStartSec={room.episode.introStartSec}
          introEndSec={room.episode.introEndSec}
          outroStartSec={room.episode.outroStartSec}
          startSec={room.positionSec}
          audioKind={room.episode.audioKind ?? "SUB"}
          subtitleUrl={room.episode.subtitleUrl}
          persistProgress={false}
          followOnly={!isHost}
          onPlayback={({ positionSec, playing }) => sendSync(positionSec, playing)}
          videoRef={videoRef}
        />
      </div>
      {viewers.length ? <p className="mt-3 text-xs text-muted">Watching: {viewers.join(", ")}</p> : null}
      <form
        className="card-panel mt-6 flex flex-col gap-2 p-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const body = String(new FormData(event.currentTarget).get("body") ?? "").trim();
          if (!body) return;
          socketRef.current?.emit("chat", { body }, (res: { error?: string }) => {
            if (res?.error) setError(res.error);
          });
          event.currentTarget.reset();
        }}
      >
        <input name="body" required maxLength={280} placeholder="Say something" className="field-input flex-1" />
        <button type="submit" className="rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink">
          Send
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      <ul className="card-panel mt-4 divide-y divide-line">
        {room.messages.map((item) => (
          <li key={item.id} className="px-4 py-2.5 text-sm">
            <span className="font-medium">{item.displayName}</span>
            <span className="text-muted"> · {item.body}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
