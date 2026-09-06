"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminBadge, AdminButton, AdminHeader, AdminNotice, AdminTable, Td, Th } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Job = {
  id: string;
  status: string;
  error: string | null;
  videoUrl: string | null;
  createdAt: string;
  finishedAt: string | null;
  progress?: { percent: number | null; mode: string | null; position: number | null } | null;
  episode: {
    id: string;
    name: string;
    number: number;
    audioKind: string;
    encodeStatus: string;
    publish: string;
    videoUrl: string | null;
    season: { number: number; title: { id: string; name: string } };
  };
};

type Filter = "all" | "active" | "draft-ready" | "failed";

export default function AdminEncodesPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const next = await api<Job[]>("/admin/encodes");
    setItems(next);
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  const active = items.some((job) => job.status === "queued" || job.status === "encoding");
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [active]);

  const visible = useMemo(() => {
    if (filter === "active") return items.filter((job) => job.status === "queued" || job.status === "encoding");
    if (filter === "failed") return items.filter((job) => job.status === "failed");
    if (filter === "draft-ready") {
      return items.filter(
        (job) =>
          (job.status === "ready" || job.episode.encodeStatus === "ready") && job.episode.publish !== "PUBLISHED"
      );
    }
    return items;
  }, [filter, items]);

  async function act(episodeId: string, action: "retry" | "cancel") {
    setError("");
    setNote("");
    setBusy(`${action}-${episodeId}`);
    try {
      await api(`/admin/episodes/${episodeId}/encode/${action}`, { method: "POST" });
      setNote(action === "retry" ? "Encode queued again." : "Encode cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update encode");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main>
      <AdminHeader
        title="Encode jobs"
        description="Uploads stay draft until you publish. Active jobs poll every few seconds. Copy means the file was already H.264 + AAC."
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {note ? <AdminNotice tone="ok">{note}</AdminNotice> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["active", "Queued / encoding"],
            ["draft-ready", "Ready but still draft"],
            ["failed", "Failed"]
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-sm ring-1 ring-white/10 ${filter === key ? "chip-on" : "bg-elevated text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <AdminTable>
        <thead>
          <tr className="border-b border-line">
            <Th>Episode</Th>
            <Th>Status</Th>
            <Th>When</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {visible.map((job) => {
            const active = job.status === "queued" || job.status === "encoding";
            return (
              <tr key={job.id} className="border-t border-line">
                <Td>
                  <Link href={`/admin/titles/${job.episode.season.title.id}`} className="hover:text-accent">
                    {job.episode.season.title.name}
                  </Link>
                  <p className="text-xs text-muted">
                    S{job.episode.season.number} E{job.episode.number} · {job.episode.audioKind} · {job.episode.name}
                  </p>
                  <p className="text-xs text-muted">
                    Episode {job.episode.publish.toLowerCase()}
                    {job.episode.videoUrl ? " · has file" : " · no file"}
                  </p>
                  {job.error ? <p className="text-xs text-amber-300">{job.error}</p> : null}
                </Td>
                <Td>
                  <AdminBadge
                    tone={job.status === "ready" ? "ok" : job.status === "failed" || job.status === "cancelled" ? "warn" : "muted"}
                  >
                    {job.status}
                  </AdminBadge>
                  {job.status === "encoding" && job.progress?.percent != null ? (
                    <p className="mt-1 text-xs text-muted">
                      {job.progress.percent}%
                      {job.progress.mode ? ` · ${job.progress.mode}` : ""}
                    </p>
                  ) : null}
                  {job.status === "queued" && job.progress?.position ? (
                    <p className="mt-1 text-xs text-muted">Queue #{job.progress.position}</p>
                  ) : null}
                </Td>
                <Td className="text-muted">{new Date(job.createdAt).toLocaleString()}</Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {active ? (
                      <AdminButton
                        type="button"
                        variant="ghost"
                        className="h-8 px-3 text-xs"
                        disabled={busy === `cancel-${job.episode.id}`}
                        onClick={() => void act(job.episode.id, "cancel")}
                      >
                        Cancel
                      </AdminButton>
                    ) : (
                      <AdminButton
                        type="button"
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                        disabled={busy === `retry-${job.episode.id}`}
                        onClick={() => void act(job.episode.id, "retry")}
                      >
                        Retry
                      </AdminButton>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
          {!visible.length ? (
            <tr>
              <Td className="text-muted">
                {filter === "draft-ready"
                  ? "No ready drafts. Encode a pack, then publish the season on the title."
                  : "No encode jobs in this filter. Upload a video on a title."}
              </Td>
              <Td />
              <Td />
              <Td />
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </main>
  );
}
