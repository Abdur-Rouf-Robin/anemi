"use client";

import { useEffect, useState } from "react";

import { AdminHeader, AdminNotice, AdminTable, Td, Th } from "@/components/admin/ui";
import { AdminOnly } from "@/components/admin-only";
import { api } from "@/lib/client-api";

type Row = {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Row[]>("/admin/audit")
      .then(setItems)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AdminOnly>
      <main>
        <AdminHeader title="Audit log" description="Role changes, publish, deletes, and newsletter sends." />
        {error ? <AdminNotice>{error}</AdminNotice> : null}
        <AdminTable>
          <thead>
            <tr className="border-b border-line">
              <Th>When</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
              <Th>Id</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <Td className="text-muted">{new Date(row.createdAt).toLocaleString()}</Td>
                <Td className="font-medium">{row.action}</Td>
                <Td>{row.entity}</Td>
                <Td className="truncate text-muted">{row.entityId}</Td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <Td className="text-muted">No staff actions recorded yet.</Td>
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
