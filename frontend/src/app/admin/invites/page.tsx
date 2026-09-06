"use client";

import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, AdminTable, Field, Td, Th, adminControl } from "@/components/admin/ui";
import { AdminOnly } from "@/components/admin-only";
import { api } from "@/lib/client-api";

type Invite = {
  id: string;
  code: string;
  email: string | null;
  note: string | null;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  url?: string;
};

export default function AdminInvitesPage() {
  const [items, setItems] = useState<Invite[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState("");

  function load() {
    return api<Invite[]>("/admin/invites").then(setItems);
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const row = await api<Invite>("/admin/invites", {
        method: "POST",
        body: JSON.stringify({
          email: String(data.get("email") ?? "").trim() || undefined,
          note: String(data.get("note") ?? "").trim() || undefined,
          days: Number(data.get("days") || 14)
        })
      });
      form.reset();
      setNote(row.url ?? row.code);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    }
  }

  async function revoke(id: string) {
    setError("");
    try {
      await api(`/admin/invites/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke invite");
    }
  }

  function status(row: Invite) {
    if (row.usedAt) return "Used";
    if (row.revokedAt) return "Revoked";
    if (new Date(row.expiresAt).getTime() <= Date.now()) return "Expired";
    return "Open";
  }

  return (
    <AdminOnly>
      <main className="space-y-8">
        <AdminHeader title="Invites" description="Send a link. Signup is invite-only unless you change Site settings." />
        {error ? <AdminNotice>{error}</AdminNotice> : null}
        <AdminCard className="max-w-xl">
          <form onSubmit={(event) => void create(event)} className="space-y-3">
            <Field label="Reserve for email (optional)">
              <input name="email" type="email" className={adminControl} placeholder="friend@example.com" />
            </Field>
            <Field label="Note">
              <input name="note" className={adminControl} placeholder="Season 2 reviewer" />
            </Field>
            <Field label="Days until expiry">
              <input name="days" type="number" min={1} max={365} defaultValue={14} className={adminControl} />
            </Field>
            <AdminButton type="submit">Create invite</AdminButton>
          </form>
          {note ? (
            <p className="mt-4 break-all text-sm">
              <button
                type="button"
                className="text-accent"
                onClick={() => {
                  void navigator.clipboard.writeText(note);
                  setCopied(note);
                }}
              >
                {copied === note ? "Copied" : note}
              </button>
            </p>
          ) : null}
        </AdminCard>
        <AdminTable>
          <thead>
            <tr className="border-b border-line">
              <Th>Code</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Expires</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <Td className="font-mono text-xs">{row.code}</Td>
                <Td className="text-muted">{row.email || row.note || "—"}</Td>
                <Td>{status(row)}</Td>
                <Td className="text-muted">{new Date(row.expiresAt).toLocaleDateString()}</Td>
                <Td>
                  {status(row) === "Open" ? (
                    <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => void revoke(row.id)}>
                      Revoke
                    </button>
                  ) : null}
                </Td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <Td className="text-muted">No invites yet.</Td>
                <Td />
                <Td />
                <Td />
                <Td />
              </tr>
            ) : null}
          </tbody>
        </AdminTable>
      </main>
    </AdminOnly>
  );
}
