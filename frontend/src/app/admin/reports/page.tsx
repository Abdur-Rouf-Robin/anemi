"use client";

import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Playback = {
  id: string;
  kind: string;
  note: string | null;
  createdAt: string;
  user: { displayName: string } | null;
  episode: {
    id: string;
    name: string;
    number: number;
    audioKind: string;
    season: { number: number; title: { id: string; name: string } };
  };
};

type SkipRow = {
  id: string;
  introStartSec: number | null;
  introEndSec: number | null;
  outroStartSec: number | null;
  note: string | null;
  user: { displayName: string };
  episode: {
    id: string;
    name: string;
    number: number;
    audioKind: string;
    season: { number: number; title: { id: string; name: string } };
  };
};

type Report = {
  id: string;
  reason: string;
  createdAt: string;
  user: { displayName: string };
  comment: {
    id: string;
    body: string;
    user: { displayName: string };
    episode: { id: string; name: string };
  };
};

export default function AdminReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [playback, setPlayback] = useState<Playback[]>([]);
  const [skips, setSkips] = useState<SkipRow[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const [comments, playbackRows, skipRows] = await Promise.all([
      api<Report[]>("/admin/reports"),
      api<Playback[]>("/admin/playback-reports"),
      api<SkipRow[]>("/admin/skip-suggestions")
    ]);
    setItems(comments);
    setPlayback(playbackRows);
    setSkips(skipRows);
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function remove(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    await api(`/admin/comments/${commentId}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <AdminHeader title="Reports" description="Comment reports and playback problems from the watch page." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <div className="space-y-3">
        {items.map((row) => (
          <AdminCard key={row.id}>
            <p className="text-xs text-muted">
              {row.user.displayName} reported · {row.reason} · {row.comment.episode.name}
            </p>
            <p className="mt-3 text-sm">
              <span className="text-muted">{row.comment.user.displayName}: </span>
              {row.comment.body}
            </p>
            <AdminButton type="button" variant="danger" className="mt-4 h-8 px-3 text-xs" onClick={() => void remove(row.comment.id)}>
              Delete comment
            </AdminButton>
          </AdminCard>
        ))}
        {!items.length ? <p className="text-sm text-muted">No comment reports.</p> : null}
      </div>
      <h2 className="mt-8 mb-3 text-sm font-semibold">Playback</h2>
      <div className="space-y-3">
        {playback.map((row) => (
          <AdminCard key={row.id}>
            <p className="text-xs text-muted">
              {row.user?.displayName ?? "Guest"} · {row.kind} · {row.episode.season.title.name} S{row.episode.season.number} E{row.episode.number} {row.episode.name} · {row.episode.audioKind}
            </p>
            {row.note ? <p className="mt-2 text-sm">{row.note}</p> : null}
          </AdminCard>
        ))}
        {!playback.length ? <p className="text-sm text-muted">No playback reports.</p> : null}
      </div>
      <h2 className="mt-8 mb-3 text-sm font-semibold">Skip markers</h2>
      <div className="space-y-3">
        {skips.map((row) => (
          <AdminCard key={row.id}>
            <p className="text-xs text-muted">
              {row.user.displayName} · {row.episode.season.title.name} S{row.episode.season.number} E{row.episode.number} {row.episode.name} · {row.episode.audioKind}
            </p>
            <p className="mt-2 text-sm">
              Intro {row.introStartSec ?? "—"}–{row.introEndSec ?? "—"} · Ending {row.outroStartSec ?? "—"}
            </p>
            {row.note ? <p className="mt-1 text-sm">{row.note}</p> : null}
            <div className="mt-3 flex gap-2">
              <AdminButton type="button" className="h-8 px-3 text-xs" onClick={() => void api(`/admin/skip-suggestions/${row.id}/apply`, { method: "POST" }).then(() => load())}>
                Apply
              </AdminButton>
              <AdminButton type="button" variant="ghost" className="h-8 px-3 text-xs" onClick={() => void api(`/admin/skip-suggestions/${row.id}/decline`, { method: "POST" }).then(() => load())}>
                Decline
              </AdminButton>
            </div>
          </AdminCard>
        ))}
        {!skips.length ? <p className="text-sm text-muted">No skip suggestions.</p> : null}
      </div>
    </main>
  );
}
