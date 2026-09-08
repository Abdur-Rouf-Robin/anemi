"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SignInGate } from "@/components/sign-in-gate";
import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client-api";
import { formatRelativeTime } from "@/lib/utils";

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
    return <SignInGate title="Personal Updates" blurb="Sign in to see recent updates from shows you follow." />;
  }

  return (
    <main className="page-shell max-w-3xl py-8 pb-16 xl:py-10">
      <PageHeader
        title="Personal Updates"
        blurb="Recent updates from shows you follow"
        actions={
          items?.some((item) => !item.read) ? (
            <button type="button" onClick={() => void markAll()} className="filter-btn">
              Mark all read
            </button>
          ) : null
        }
      />
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      {(items ?? []).length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {items!.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href || "/library"}
                onClick={() => void openNote(item)}
                className="block px-4 py-3.5 hover:bg-elevated"
              >
                <p className={`text-sm font-medium ${item.read ? "text-muted" : "text-ink"}`}>{item.title}</p>
                <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                {item.createdAt ? <p className="mt-1 text-xs text-muted">{formatRelativeTime(item.createdAt)}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : items ? (
        <EmptyState
          title="You've reached the end!"
          blurb="Check back later for more updates"
          href="/browse"
          hrefLabel="Browse series"
        />
      ) : (
        <p className="text-sm text-muted">Loading more updates...</p>
      )}
    </main>
  );
}
