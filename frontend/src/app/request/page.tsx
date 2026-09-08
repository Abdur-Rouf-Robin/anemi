"use client";

import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/client-api";

export default function RequestPage() {
  const [note, setNote] = useState("");

  return (
    <main className="page-shell max-w-lg py-8 pb-16 xl:py-10">
      <PageHeader
        title="Request Series"
        blurb="Ask staff to add a title you own or license. Anemi will not pull streams from other sites."
      />
      <form
        className="card-panel space-y-3 p-4 sm:p-5"
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
        <input name="name" required minLength={2} placeholder="Series name" className="field-input" />
        <input name="referenceUrl" placeholder="Reference URL (optional)" className="field-input" />
        <textarea name="details" placeholder="Why it should be added" className="field-input min-h-28 py-2" />
        <button type="submit" className="hero-cta h-10 px-4 text-sm font-semibold">
          Send request
        </button>
      </form>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
    </main>
  );
}
