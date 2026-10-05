"use client";

import { useState } from "react";

import { api } from "@/lib/client-api";

const KINDS = [
  { id: "video", label: "Video broken" },
  { id: "audio", label: "Audio out of sync" },
  { id: "subtitle", label: "Subtitles out of sync" },
  { id: "skip", label: "Skip markers wrong" }
] as const;

export function PlaybackReport({ episodeId }: { episodeId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("video");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api(`/catalog/episodes/${episodeId}/playback-report`, {
        method: "POST",
        body: JSON.stringify({ kind, note: note.trim() || undefined })
      });
      setMessage("Report sent.");
      setOpen(false);
      setNote("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send the report.");
    }
  }

  return (
    <div className={open ? "basis-full" : "inline-flex items-center gap-2"}>
      <button type="button" className="hover:text-ink" onClick={() => setOpen((value) => !value)}>
        Report a problem
      </button>
      {message ? <span>{message}</span> : null}
      {open ? (
        <form onSubmit={(event) => void submit(event)} className="mt-2 flex w-full basis-full flex-col gap-2 rounded-lg bg-elevated p-3 ring-1 ring-line">
          {KINDS.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="kind" checked={kind === item.id} onChange={() => setKind(item.id)} />
              {item.label}
            </label>
          ))}
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional detail"
            maxLength={500}
            className="h-9 rounded-md bg-canvas px-2 text-sm text-ink ring-1 ring-line"
          />
          <button type="submit" className="btn btn-primary h-8 w-fit px-3 text-xs">
            Send
          </button>
        </form>
      ) : null}
    </div>
  );
}
