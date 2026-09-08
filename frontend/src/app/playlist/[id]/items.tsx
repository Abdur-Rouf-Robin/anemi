"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PosterArt } from "@/components/poster-card";
import { StatusDot, TitleMeta } from "@/components/title-meta";
import { api } from "@/lib/client-api";
import type { TitleCard } from "@/lib/types";

export function PlaylistItems({ playlistId, items }: { playlistId: string; items: TitleCard[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <section className="page-shell">
      <h2 className="text-xl font-semibold tracking-tight">Titles</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((title) => (
          <li key={title.id} className="card-panel flex items-center gap-3 p-3">
            <Link href={`/title/${title.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
              <PosterArt name={title.name} hue={title.hue} src={title.posterUrl} className="h-16 w-12 shrink-0 rounded-md" overlay={false} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <StatusDot status={title.status} />
                  <span className="block truncate font-medium">{title.name}</span>
                </span>
                <TitleMeta title={title} className="mt-0.5" />
              </span>
            </Link>
            <button
              type="button"
              disabled={busy === title.id}
              className="text-xs text-muted hover:text-ink disabled:opacity-60"
              onClick={() => {
                setBusy(title.id);
                void api(`/playlists/${playlistId}/items/${title.id}`, { method: "DELETE" })
                  .then(() => router.refresh())
                  .finally(() => setBusy(null));
              }}
            >
              {busy === title.id ? "…" : "Remove"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
