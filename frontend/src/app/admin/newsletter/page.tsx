"use client";

import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, AdminTable, Field, Td, Th, adminControl } from "@/components/admin/ui";
import { AdminOnly } from "@/components/admin-only";
import { api } from "@/lib/client-api";

type Row = { id: string; email: string; createdAt: string };
type Campaign = {
  id: string;
  subject: string;
  body: string;
  status: string;
  sentCount: number;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};

export default function AdminNewsletterPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    api<Row[]>("/admin/newsletter").then(setItems).catch((err: Error) => setError(err.message));
    api<Campaign[]>("/admin/newsletter/campaigns")
      .then(setCampaigns)
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  function exportCsv() {
    const lines = ["email,joined", ...items.map((row) => `${row.email},${row.createdAt}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "anemi-newsletter.csv";
    link.click();
    URL.revokeObjectURL(href);
  }

  async function send() {
    setSending(true);
    setError("");
    setNote("");
    try {
      const result = await api<Campaign>("/admin/newsletter/send", {
        method: "POST",
        body: JSON.stringify({ subject, body })
      });
      setNote(`Sent to ${result.sentCount} subscriber${result.sentCount === 1 ? "" : "s"}.`);
      setSubject("");
      setBody("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminOnly>
    <main className="space-y-8">
      <AdminHeader
        title="Newsletter"
        description={`${items.length} subscribers from the site footer. Configure SMTP in backend/.env to send.`}
        action={
          <AdminButton type="button" variant="secondary" onClick={exportCsv} disabled={!items.length}>
            Export CSV
          </AdminButton>
        }
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {note ? <p className="text-sm text-muted">{note}</p> : null}

      <AdminCard>
        <h2 className="text-sm font-medium">Send an update</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Subject">
            <input
              className={adminControl}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="This week on Anemi"
            />
          </Field>
          <Field label="Body">
            <textarea
              className={`${adminControl} min-h-32 py-2`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Plain text. Goes to every subscriber."
            />
          </Field>
          <AdminButton type="button" onClick={() => void send()} disabled={sending || subject.length < 3 || body.length < 8}>
            {sending ? "Sending…" : "Send to subscribers"}
          </AdminButton>
        </div>
      </AdminCard>

      {campaigns.length ? (
        <AdminTable>
          <thead>
            <tr className="border-b border-line">
              <Th>Campaign</Th>
              <Th>Status</Th>
              <Th>Sent</Th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <Td>
                  <p>{row.subject}</p>
                  {row.error ? <p className="text-xs text-amber-300">{row.error}</p> : null}
                </Td>
                <Td className="text-muted">{row.status}</Td>
                <Td className="text-muted">{row.sentCount}</Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : null}

      <AdminTable>
        <thead>
          <tr className="border-b border-line">
            <Th>Email</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-line">
              <Td>{row.email}</Td>
              <Td className="text-muted">{new Date(row.createdAt).toLocaleDateString()}</Td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <Td className="text-muted">No subscribers yet.</Td>
              <Td />
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </main>
    </AdminOnly>
  );
}
