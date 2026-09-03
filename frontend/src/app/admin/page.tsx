"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clapperboard, Flag, Inbox, Mail, PlayCircle, Users, Film, MessageSquareText, CalendarDays } from "lucide-react";

import { AdminBadge, AdminCard, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Overview = {
  published: number;
  titles: number;
  episodes: number;
  users: number;
  openRequests: number;
  reports: number;
  comments: number;
  posts: number;
  subscribers: number;
  encoding?: number;
  recentTitles: { id: string; name: string; publish: string; updatedAt: string }[];
  recentRequests: { id: string; name: string; status: string; createdAt: string }[];
};

export default function AdminHomePage() {
  const [stats, setStats] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<{
    ok: boolean;
    db: boolean;
    media: boolean;
    ffmpeg: boolean;
    smtp: boolean;
  } | null>(null);

  useEffect(() => {
    api<Overview>("/admin/overview")
      .then(setStats)
      .catch((err: Error) => setError(err.message));
    api<{ ok: boolean; db: boolean; media: boolean; ffmpeg: boolean; smtp: boolean }>("/health")
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const cards = [
    { label: "Homepage", value: "Edit", href: "/admin/home", icon: Clapperboard },
    { label: "Schedule", value: "Air times", href: "/admin/schedule", icon: CalendarDays },
    { label: "Published", value: stats?.published ?? "—", href: "/admin/titles", icon: PlayCircle },
    { label: "Titles", value: stats?.titles ?? "—", href: "/admin/titles", icon: Clapperboard },
    { label: "Episodes", value: stats?.episodes ?? "—", href: "/admin/titles", icon: PlayCircle },
    { label: "Users", value: stats?.users ?? "—", href: "/admin/users", icon: Users },
    { label: "Open requests", value: stats?.openRequests ?? "—", href: "/admin/requests", icon: Inbox },
    { label: "Reports", value: stats?.reports ?? "—", href: "/admin/reports", icon: Flag },
    { label: "Comments", value: stats?.comments ?? "—", href: "/admin/comments", icon: MessageSquareText },
    { label: "Subscribers", value: stats?.subscribers ?? "—", href: "/admin/newsletter", icon: Mail },
    { label: "Encode jobs", value: stats?.encoding ?? "—", href: "/admin/encodes", icon: Film }
  ];

  return (
    <main>
      <AdminHeader title="Overview" description="Curate the public home, catalog, requests, and moderation." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {health ? (
        <p className="mb-4 text-xs text-muted">
          API {health.ok ? "ok" : "degraded"} · DB {health.db ? "up" : "down"} · media{" "}
          {health.media ? "writable" : "missing"} · ffmpeg {health.ffmpeg ? "on" : "off"} · SMTP{" "}
          {health.smtp ? "set" : "unset"}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="card-panel p-4 transition-transform duration-200 hover:bg-elevated motion-safe:hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{stat.label}</p>
                <Icon className="size-4 text-muted" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <AdminCard>
          <h2 className="text-sm font-medium">Recent titles</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(stats?.recentTitles ?? []).map((title) => (
              <li key={title.id} className="flex items-center justify-between gap-3">
                <Link href={`/admin/titles/${title.id}`} className="truncate hover:text-accent">
                  {title.name}
                </Link>
                <AdminBadge tone={title.publish === "PUBLISHED" ? "ok" : "muted"}>{title.publish}</AdminBadge>
              </li>
            ))}
          </ul>
        </AdminCard>
        <AdminCard>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Open requests</h2>
            <Link href="/admin/requests" className="text-xs text-accent">
              Inbox
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {(stats?.recentRequests ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{row.name}</span>
                <AdminBadge>{row.status}</AdminBadge>
              </li>
            ))}
            {!stats?.recentRequests?.length ? <li className="text-muted">No open requests.</li> : null}
          </ul>
        </AdminCard>
      </div>
    </main>
  );
}
