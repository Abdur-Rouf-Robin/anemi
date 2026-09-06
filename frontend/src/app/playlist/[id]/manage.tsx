"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client-api";

export function PlaylistManage({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [label, setLabel] = useState(name);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = label.trim();
        if (next.length < 2) return;
        setPending(true);
        void api(`/playlists/${id}`, { method: "PATCH", body: JSON.stringify({ name: next }) })
          .then(() => router.refresh())
          .finally(() => setPending(false));
      }}
    >
      <input
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        maxLength={60}
        className="h-9 w-40 rounded-full bg-elevated px-3 text-sm ring-1 ring-white/10"
      />
      <button type="submit" disabled={pending} className="h-9 rounded-full bg-elevated px-3 text-sm ring-1 ring-white/10 disabled:opacity-60">
        Rename
      </button>
      <button
        type="button"
        disabled={pending}
        className="h-9 rounded-full px-3 text-sm text-muted hover:text-ink disabled:opacity-60"
        onClick={() => {
          if (!confirm("Delete this playlist?")) return;
          setPending(true);
          void api(`/playlists/${id}`, { method: "DELETE" })
            .then(() => router.push("/library/playlists"))
            .finally(() => setPending(false));
        }}
      >
        Delete
      </button>
    </form>
  );
}
