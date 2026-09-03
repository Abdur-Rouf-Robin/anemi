"use client";

import { useState } from "react";

import { api } from "@/lib/client-api";
import { LegalPage } from "../legal/page-shell";

export default function ContactPage() {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <LegalPage
      title="Contact"
      body={[
        "Use this form for account or takedown issues. Catalog additions go through Request a title. Product questions can go on Community."
      ]}
    >
      <form
        className="mt-8 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setNote("");
          setError("");
          setPending(true);
          const form = event.currentTarget;
          const data = new FormData(form);
          void api("/contact", {
            method: "POST",
            body: JSON.stringify({
              name: String(data.get("name") ?? ""),
              email: String(data.get("email") ?? ""),
              body: String(data.get("body") ?? "")
            })
          })
            .then(() => {
              setNote("Sent. We stored the message for the site operator.");
              form.reset();
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setPending(false));
        }}
      >
        <input
          name="name"
          required
          minLength={2}
          placeholder="Your name"
          className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10"
        />
        <textarea
          name="body"
          required
          minLength={8}
          placeholder="How can we help?"
          className="min-h-32 w-full rounded-xl bg-elevated px-3 py-2 text-sm ring-1 ring-white/10"
        />
        <button type="submit" disabled={pending} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
          {pending ? "Sending…" : "Send"}
        </button>
        {note ? <p className="text-sm text-muted">{note}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
    </LegalPage>
  );
}
