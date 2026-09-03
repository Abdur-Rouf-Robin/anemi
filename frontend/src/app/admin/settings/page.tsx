"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, Field, adminControl } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Settings = {
  announcement: string | null;
  announcementHref: string | null;
  scheduleMailEnabled: boolean;
  contactEmail: string | null;
  communityGuidelines: string | null;
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
        communityGuidelines: String(form.get("communityGuidelines") ?? "")
      })
    });
    setSettings(next);
    setNote("Saved.");
  }

  if (!settings && !error) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <main>
      <AdminHeader
        title="Site"
        description="Public banner, comment guidelines, contact routing, and weekly schedule mail."
        action={
          <Link href="/admin/home" className="text-sm text-accent">
            Homepage rails
          </Link>
        }
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
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
          <label className="flex items-center gap-2 text-sm text-muted">
            <input name="scheduleMailEnabled" type="checkbox" defaultChecked={settings?.scheduleMailEnabled} />
            Send weekly schedule email to footer subscribers (needs SMTP)
          </label>
          <AdminButton type="submit">Save</AdminButton>
        </form>
      </AdminCard>
      {note ? <p className="mt-4 text-sm text-muted">{note}</p> : null}
    </main>
  );
}
