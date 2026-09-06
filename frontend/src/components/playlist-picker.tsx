"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/client-api";
import type { Playlist } from "@/lib/types";

export function PlaylistPicker({ titleId }: { titleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<Playlist[] | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    void api<Playlist[]>("/playlists")
      .then(setLists)
      .catch(() => {
        setLists(null);
        router.push("/account");
      });
  }, [open, router]);

  async function add(id: string) {
    try {
      await api(`/playlists/${id}/items`, { method: "POST", body: JSON.stringify({ titleId }) });
      setNote("Added.");
      setOpen(false);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not add");
    }
  }

  async function create() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    try {
      const created = await api<Playlist>("/playlists", { method: "POST", body: JSON.stringify({ name: trimmed }) });
      setName("");
      await add(created.id);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not create");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10"
      >
        Playlist
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-64 rounded-2xl bg-canvas p-3 ring-1 ring-white/10 shadow-xl">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Add to playlist</p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto">
            {(lists ?? []).length === 0 ? (
              <li className="px-1 py-2 text-sm text-muted">No playlists yet.</li>
            ) : (
              (lists ?? []).map((list) => (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => void add(list.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-elevated"
                  >
                    <span className="truncate">{list.name}</span>
                    <span className="text-xs text-muted">{list.itemCount}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <form
            className="mt-2 flex gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              void create();
            }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New playlist"
              maxLength={60}
              className="h-9 min-w-0 flex-1 rounded-full bg-elevated px-3 text-sm ring-1 ring-white/10"
            />
            <button type="submit" className="h-9 rounded-full bg-accent px-3 text-xs font-semibold text-accent-ink">
              Add
            </button>
          </form>
        </div>
      ) : null}
      {note && !open ? <p className="sr-only">{note}</p> : null}
    </div>
  );
}
