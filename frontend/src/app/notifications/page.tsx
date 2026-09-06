"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client-api";

type Note = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  read: boolean;
  createdAt?: string;
};

export default function NotificationsPage() {
  const { user } = useSession();
  const [items, setItems] = useState<Note[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const data = await api<{ items: Note[] }>("/notifications");
    setItems(data.items);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((err: Error) => setError(err.message));
  }, [user]);

  async function markAll() {
    await api("/notifications/read", { method: "PUT" });
    await load();
  }

  async function openNote(note: Note) {
    if (!note.read) {
      await api(`/notifications/${note.id}/read`, { method: "PUT" }).catch(() => undefined);
    }
  }

  if (user === undefined) {
    return (
      <main className="page-shell py-10">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-shell max-w-lg py-16">
        <PageIntro kicker="Inbox" title="Notifications" blurb="Sign in to see follows and new episodes." />
        <Link href="/account" className="mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell max-w-2xl py-8 pb-16">
      <PageIntro
        kicker="Inbox"
        title="Notifications"
        blurb="New episodes on titles you follow, and staff publishes."
        actions={
          items?.some((item) => !item.read) ? (
            <button type="button" onClick={() => void markAll()} className="text-sm text-accent">
              Mark all read
            </button>
          ) : null
        }
      />
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <ul className="card-panel mt-6 divide-y divide-line overflow-hidden">
        {(items ?? []).map((item) => (
          <li key={item.id}>
            <Link
              href={item.href || "/library"}
              onClick={() => void openNote(item)}
              className="block px-4 py-3 hover:bg-elevated"
            >
              <p className={`text-sm font-medium ${item.read ? "text-muted" : "text-ink"}`}>{item.title}</p>
              <p className="mt-0.5 text-sm text-muted">{item.body}</p>
            </Link>
          </li>
        ))}
      </ul>
      {items && !items.length ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing yet"
            blurb="Follow a title. When staff publish an episode, it shows up here."
            href="/browse"
            hrefLabel="Browse"
          />
        </div>
      ) : null}
    </main>
  );
}
