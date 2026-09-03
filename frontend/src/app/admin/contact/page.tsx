"use client";

import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Row = { id: string; name: string; email: string; body: string; createdAt: string };

export default function AdminContactPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<Row[]>("/admin/contact"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    await api(`/admin/contact/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <AdminHeader title="Contact" description="Messages from the public contact form." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <div className="space-y-3">
        {items.map((row) => (
          <AdminCard key={row.id}>
            <p className="text-xs text-muted">
              {row.name} · {row.email} · {new Date(row.createdAt).toLocaleString()}
            </p>
            <p className="mt-3 text-sm">{row.body}</p>
            <AdminButton type="button" variant="danger" className="mt-4 h-8 px-3 text-xs" onClick={() => void remove(row.id)}>
              Delete
            </AdminButton>
          </AdminCard>
        ))}
        {!items.length ? <p className="text-sm text-muted">No messages.</p> : null}
      </div>
    </main>
  );
}
