"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client-api";
import type { Playlist } from "@/lib/types";

export function CreatePlaylist() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
        if (name.length < 2) return;
        setPending(true);
        setNote("");
        void api<Playlist>("/playlists", { method: "POST", body: JSON.stringify({ name }) })
          .then((list) => {
            event.currentTarget.reset();
            router.push(`/playlist/${list.id}`);
          })
          .catch((err: Error) => setNote(err.message))
          .finally(() => setPending(false));
      }}
    >
      <input
        name="name"
        required
        minLength={2}
        maxLength={60}
        placeholder="Weekend watch"
        className="h-10 flex-1 rounded-full bg-elevated px-4 text-sm ring-1 ring-white/10"
      />
      <button type="submit" disabled={pending} className="h-10 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60">
        {pending ? "Creating…" : "Create playlist"}
      </button>
      {note ? <p className="text-sm text-muted sm:w-full">{note}</p> : null}
    </form>
  );
}
