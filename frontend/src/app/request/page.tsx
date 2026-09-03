"use client";

import { useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { api } from "@/lib/client-api";

export default function RequestPage() {
  const [note, setNote] = useState("");

  return (
    <main className="page-shell max-w-lg py-10 pb-16">
      <PageIntro
        kicker="Catalog"
        title="Request a title"
        blurb="Ask for something you own or license to be added. We will not pull streams from other sites."
      />
      <form
        className="card-panel mt-6 space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void api("/requests", {
            method: "POST",
            body: JSON.stringify({
              name: form.get("name"),
              referenceUrl: form.get("referenceUrl") || undefined,
              details: form.get("details") || undefined
            })
          })
            .then(() => {
              setNote("Request sent.");
              event.currentTarget.reset();
            })
            .catch((err: Error) => setNote(err.message));
        }}
      >
        <input name="name" required minLength={2} placeholder="Title name" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
        <input name="referenceUrl" placeholder="Reference URL (optional)" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
        <textarea name="details" placeholder="Why it should be added" className="min-h-28 w-full rounded-xl bg-elevated px-3 py-2 text-sm ring-1 ring-white/10" />
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
          Send request
        </button>
      </form>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
    </main>
  );
}
