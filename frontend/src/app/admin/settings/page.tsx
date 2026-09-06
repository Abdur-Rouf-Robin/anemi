"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, Field, adminControl } from "@/components/admin/ui";
import { AdminOnly } from "@/components/admin-only";
import { api } from "@/lib/client-api";

type Settings = {
  announcement: string | null;
  announcementHref: string | null;
  scheduleMailEnabled: boolean;
  contactEmail: string | null;
  communityGuidelines: string | null;
  signupMode?: "open" | "invite" | "closed";
  smtpConfigured?: boolean;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Settings>("/admin/settings")
      .then(setSettings)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNote("");
    const form = new FormData(event.currentTarget);
    const next = await api<Settings>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({
        announcement: String(form.get("announcement") ?? ""),
        announcementHref: String(form.get("announcementHref") ?? ""),
        scheduleMailEnabled: form.get("scheduleMailEnabled") === "on",
        contactEmail: String(form.get("contactEmail") ?? ""),
        communityGuidelines: String(form.get("communityGuidelines") ?? ""),
        signupMode: String(form.get("signupMode") ?? "invite")
      })
    });
    setSettings(next);
    setNote("Saved.");
  }

  if (!settings && !error) {
    return (
      <AdminOnly>
        <p className="text-sm text-muted">Loading…</p>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
    <main>
      <AdminHeader
        title="Site"
        description="Signup policy, public banner, comment guidelines, and weekly schedule mail."
        action={
          <Link href="/admin/home" className="text-sm text-accent">
            Homepage rails
          </Link>
        }
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <AdminNotice tone={settings?.smtpConfigured ? "ok" : undefined}>
        {settings?.smtpConfigured
          ? "SMTP is set. Password reset, follower publish mail, newsletter, and weekly schedule can send."
          : "SMTP is unset. Add SMTP_HOST or SMTP_URL in backend/.env to unlock password reset mail, follower publish mail, newsletter, and weekly schedule."}
      </AdminNotice>
      <AdminNotice>
        Postgres + media backups are written by <code>npm run backup</code> into data/backups. Overview shows disk use and the latest dump.
      </AdminNotice>
      <AdminCard className="max-w-xl">
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <Field label="Announcement">
            <textarea
              name="announcement"
              defaultValue={settings?.announcement ?? ""}
              placeholder="New season titles are up — browse the schedule."
              className="min-h-28 w-full field-input py-2"
            />
          </Field>
          <Field label="Link">
            <input
              name="announcementHref"
              defaultValue={settings?.announcementHref ?? ""}
              placeholder="/schedule"
              className={adminControl}
            />
          </Field>
          <Field label="Community guidelines">
            <textarea
              name="communityGuidelines"
              defaultValue={settings?.communityGuidelines ?? ""}
              placeholder="Be kind. Mark spoilers. Do not post links to unauthorized copies."
              className="min-h-28 w-full field-input py-2"
            />
          </Field>
          <Field label="Contact email">
            <input
              name="contactEmail"
              type="email"
              defaultValue={settings?.contactEmail ?? ""}
              placeholder="operator@example.com"
              className={adminControl}
            />
          </Field>
          <Field label="Who can create an account">
            <select name="signupMode" defaultValue={settings?.signupMode ?? "invite"} className={adminControl}>
              <option value="invite">Invite only</option>
              <option value="open">Open signup</option>
              <option value="closed">Staff creates users</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input name="scheduleMailEnabled" type="checkbox" defaultChecked={settings?.scheduleMailEnabled} />
            Send weekly schedule email to footer subscribers (needs SMTP)
          </label>
          <AdminButton type="submit">Save</AdminButton>
        </form>
      </AdminCard>
      {note ? <p className="mt-4 text-sm text-muted">{note}</p> : null}
    </main>
    </AdminOnly>
  );
}
