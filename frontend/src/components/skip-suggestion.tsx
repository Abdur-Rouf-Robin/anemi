"use client";

import { useState } from "react";

import { api } from "@/lib/client-api";

export function SkipSuggestion({ episodeId }: { episodeId: string }) {
  const [open, setOpen] = useState(false);
  const [introStart, setIntroStart] = useState("");
  const [introEnd, setIntroEnd] = useState("");
  const [outro, setOutro] = useState("");
  const [message, setMessage] = useState("");

  function seconds(value: string) {
    return value.trim() ? Number(value) : undefined;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api(`/catalog/episodes/${episodeId}/skip-suggestion`, {
        method: "POST",
        body: JSON.stringify({
          introStartSec: seconds(introStart),
          introEndSec: seconds(introEnd),
          outroStartSec: seconds(outro)
        })
      });
      setMessage("Suggestion sent.");
      setOpen(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send the suggestion.");
    }
  }

  return (
    <div className={open ? "basis-full" : "inline-flex items-center gap-2"}>
      <button type="button" className="hover:text-ink" onClick={() => setOpen((value) => !value)}>
        Suggest intro / ending
      </button>
      {message ? <span>{message}</span> : null}
      {open ? (
        <form onSubmit={(event) => void submit(event)} className="mt-2 flex w-full basis-full flex-wrap items-end gap-2 rounded-lg bg-elevated p-3 ring-1 ring-line">
          <label className="text-xs text-ink">
            Intro start
            <input value={introStart} onChange={(event) => setIntroStart(event.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className="mt-1 block h-8 w-24 rounded-md bg-canvas px-2 text-sm ring-1 ring-line" />
          </label>
          <label className="text-xs text-ink">
            Intro end
            <input value={introEnd} onChange={(event) => setIntroEnd(event.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className="mt-1 block h-8 w-24 rounded-md bg-canvas px-2 text-sm ring-1 ring-line" />
          </label>
          <label className="text-xs text-ink">
            Ending start
            <input value={outro} onChange={(event) => setOutro(event.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className="mt-1 block h-8 w-24 rounded-md bg-canvas px-2 text-sm ring-1 ring-line" />
          </label>
          <button type="submit" className="btn btn-primary h-8 px-3 text-xs">
            Send
          </button>
        </form>
      ) : null}
    </div>
  );
}
