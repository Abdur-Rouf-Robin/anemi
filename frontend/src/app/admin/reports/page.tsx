"use client";

import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

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
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<Report[]>("/admin/reports"));
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
      <AdminHeader title="Comment reports" description="Remove comments that break the house rules." />
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
        {!items.length ? <p className="text-sm text-muted">No reports.</p> : null}
      </div>
    </main>
  );
}
