"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, Clapperboard, Flag, HardDrive, Inbox, Mail, PlayCircle, Users, Film, MessageSquareText, CalendarDays, ScrollText, Ticket } from "lucide-react";

import { AdminBadge, AdminCard, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { useSession } from "@/components/session-provider";
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
  playable?: number;
  inboxHasFiles?: boolean;
  encodeLive?: { currentId: string | null; percent: number; mode: string | null; busy: boolean };
  invitesOpen?: number;
  invitesUsed?: number;
  invitesExpired?: number;
  health?: { ok: boolean; db: boolean; media: boolean; inbox?: boolean; ffmpeg: boolean; smtp: boolean };
  storage?: {
    mediaBytes: number;
    mediaFiles: number;
    backupBytes: number;
    mediaLabel: string;
    backupLabel: string;
    lastBackup: {
      at: string;
      name: string;
      dump: boolean;
      mediaArchive: boolean;
      ageHours: number;
    } | null;
  };
  recentTitles: { id: string; name: string; publish: string; updatedAt: string }[];
  recentRequests: { id: string; name: string; status: string; createdAt: string }[];
};

function backupLabel(storage: Overview["storage"]) {
  const last = storage?.lastBackup;
  if (!last) return "None";
  if (last.ageHours < 1) return "Just now";
  if (last.ageHours < 48) return `${last.ageHours}h ago`;
  return `${Math.round(last.ageHours / 24)}d ago`;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const { user } = useSession();
  const role = user?.role ?? null;
  const health = stats?.health ?? null;
  const storage = stats?.storage ?? null;

  useEffect(() => {
    api<Overview>("/admin/overview")
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  const cards = [
    { label: "Homepage", value: "Edit", href: "/admin/home", icon: Clapperboard, adminOnly: true },
    { label: "Schedule", value: "Air times", href: "/admin/schedule", icon: CalendarDays },
    { label: "Published", value: stats?.published ?? "—", href: "/admin/titles", icon: PlayCircle },
    { label: "Titles", value: stats?.titles ?? "—", href: "/admin/titles", icon: Clapperboard },
    { label: "Episodes", value: stats ? `${stats.playable ?? 0}/${stats.episodes}` : "—", href: "/admin/titles", icon: PlayCircle },
    { label: "Users", value: stats?.users ?? "—", href: "/admin/users", icon: Users },
    {
      label: "Invites",
      value: stats ? `${stats.invitesOpen ?? 0} open` : "—",
      href: "/admin/invites",
      icon: Ticket
    },
    { label: "Open requests", value: stats?.openRequests ?? "—", href: "/admin/requests", icon: Inbox },
    { label: "Reports", value: stats?.reports ?? "—", href: "/admin/reports", icon: Flag },
    { label: "Comments", value: stats?.comments ?? "—", href: "/admin/comments", icon: MessageSquareText },
    { label: "Subscribers", value: stats?.subscribers ?? "—", href: "/admin/newsletter", icon: Mail },
    { label: "Encode jobs", value: stats?.encoding ?? "—", href: "/admin/encodes", icon: Film },
    { label: "Media disk", value: storage?.mediaLabel ?? "—", href: "/admin/encodes", icon: HardDrive },
    { label: "Last backup", value: backupLabel(storage ?? undefined), href: "/admin", icon: Archive },
    { label: "Audit", value: "Log", href: "/admin/audit", icon: ScrollText }
  ].filter(
    (card) =>
      role === "ADMIN" ||
      !["/admin/home", "/admin/users", "/admin/invites", "/admin/newsletter", "/admin/audit"].includes(card.href)
  );

  return (
    <main>
      <AdminHeader title="Overview" description="Curate the public home, catalog, requests, and moderation." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {stats && (stats.playable ?? 0) === 0 ? (
        <AdminNotice>
          No playable files yet. rsync licensed video into /var/www/anemi/data/inbox, open a title, Import folder, wait
          for encode, then Publish ready.
        </AdminNotice>
      ) : null}
      {health && !health.smtp ? (
        <AdminNotice>
          SMTP is unset. Invites, password reset, and follower mail will not send until you set SMTP_HOST or SMTP_URL.
        </AdminNotice>
      ) : null}
      {health ? (
        <p className="mb-4 text-xs text-muted">
          API {health.ok ? "ok" : "degraded"} · DB {health.db ? "up" : "down"} · media{" "}
          {health.media ? "writable" : "missing"} · ffmpeg {health.ffmpeg ? "on" : "off"} · SMTP{" "}
          {health.smtp ? "set" : "unset"}
          {health.inbox !== undefined ? ` · inbox ${health.inbox ? "writable" : "missing"}` : ""}
          {stats?.encodeLive?.busy
            ? ` · encoding ${stats.encodeLive.percent}%${stats.encodeLive.mode ? ` ${stats.encodeLive.mode}` : ""}`
            : ""}
          {storage
            ? ` · disk ${storage.mediaLabel} (${storage.mediaFiles} files) · backup ${
                storage.lastBackup
                  ? `${backupLabel(storage)}${storage.lastBackup.dump ? "" : " · dump missing"}${
                      storage.lastBackup.mediaArchive ? "" : " · no media archive"
                    }`
                  : "none — run npm run backup"
              }`
            : ""}
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
      {storage ? (
        <AdminCard className="mt-8">
          <h2 className="text-sm font-medium">Storage</h2>
          <p className="mt-2 text-sm text-muted">
            Media {storage.mediaLabel} in {storage.mediaFiles} file{storage.mediaFiles === 1 ? "" : "s"}. Backups{" "}
            {storage.backupLabel}.
            {storage.lastBackup
              ? ` Last run ${storage.lastBackup.name}${storage.lastBackup.dump ? " (dump ok)" : " (dump missing)"}${
                  storage.lastBackup.mediaArchive ? ", media archive ok" : ", no media.tgz"
                }.`
              : " No backup folder yet."}{" "}
            On the server: <code className="text-ink">npm run backup</code>
          </p>
        </AdminCard>
      ) : null}
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
