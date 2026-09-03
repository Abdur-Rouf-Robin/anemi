"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminBadge, AdminHeader, AdminNotice, AdminTable, Td, Th } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Job = {
  id: string;
  status: string;
  error: string | null;
  videoUrl: string | null;
  createdAt: string;
  finishedAt: string | null;
  episode: {
    id: string;
    name: string;
    number: number;
    audioKind: string;
    season: { number: number; title: { id: string; name: string } };
  };
};

export default function AdminEncodesPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Job[]>("/admin/encodes")
      .then(setItems)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main>
      <AdminHeader
        title="Encode jobs"
        description="Uploads are queued, stored, and resumed if the API restarts. Without ffmpeg, the original file is published."
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <AdminTable>
        <thead>
          <tr className="border-b border-line">
            <Th>Episode</Th>
            <Th>Status</Th>
            <Th>When</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((job) => (
            <tr key={job.id} className="border-t border-line">
              <Td>
                <Link href={`/admin/titles/${job.episode.season.title.id}`} className="hover:text-accent">
                  {job.episode.season.title.name}
                </Link>
                <p className="text-xs text-muted">
                  S{job.episode.season.number} E{job.episode.number} · {job.episode.audioKind} · {job.episode.name}
                </p>
                {job.error ? <p className="text-xs text-amber-300">{job.error}</p> : null}
              </Td>
              <Td>
                <AdminBadge tone={job.status === "ready" ? "ok" : job.status === "failed" ? "warn" : "muted"}>
                  {job.status}
                </AdminBadge>
              </Td>
              <Td className="text-muted">{new Date(job.createdAt).toLocaleString()}</Td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <Td className="text-muted">No encode jobs yet. Upload a video on a title.</Td>
              <Td />
              <Td />
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </main>
  );
}
