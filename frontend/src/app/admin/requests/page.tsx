"use client";

import { useEffect, useState } from "react";

import { AdminBadge, AdminCard, AdminHeader, AdminNotice, adminControl } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type RequestRow = {
  id: string;
  name: string;
  referenceUrl: string | null;
  details: string | null;
  status: "OPEN" | "REVIEWING" | "FULFILLED" | "DECLINED";
  createdAt: string;
  user: { displayName: string; email: string } | null;
};

const statuses: RequestRow["status"][] = ["OPEN", "REVIEWING", "FULFILLED", "DECLINED"];

export default function AdminRequestsPage() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<RequestRow[]>("/admin/requests"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function setStatus(id: string, status: RequestRow["status"]) {
    await api(`/admin/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <main>
      <AdminHeader title="Title requests" description="Fulfill or decline requests from the public form." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <div className="space-y-3">
        {items.map((row) => (
          <AdminCard key={row.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{row.name}</h2>
                <p className="mt-1 text-xs text-muted">
                  {row.user?.displayName ?? "Guest"}
                  {row.user?.email ? ` · ${row.user.email}` : ""}
                  {" · "}
                  {new Date(row.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AdminBadge tone={row.status === "FULFILLED" ? "ok" : row.status === "DECLINED" ? "warn" : "accent"}>
                  {row.status}
                </AdminBadge>
                <select
                  value={row.status}
                  onChange={(event) => void setStatus(row.id, event.target.value as RequestRow["status"])}
                  className={`${adminControl} w-auto`}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {row.details ? <p className="mt-3 text-sm text-muted">{row.details}</p> : null}
            {row.referenceUrl ? (
              <a href={row.referenceUrl} className="mt-2 inline-block text-xs text-accent" target="_blank" rel="noreferrer">
                Reference
              </a>
            ) : null}
          </AdminCard>
        ))}
        {!items.length ? <p className="text-sm text-muted">No requests yet.</p> : null}
      </div>
    </main>
  );
}
