"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminButton, AdminHeader, AdminNotice, AdminTable, Td, Th } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type CommentRow = {
  id: string;
  body: string;
  spoiler: boolean;
  createdAt: string;
  user: { displayName: string };
  episode: { id: string; name: string };
};

export default function AdminCommentsPage() {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<CommentRow[]>("/admin/comments"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    await api(`/admin/comments/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <AdminHeader title="Comments" description="Recent comments across episodes. Reports stay on the Reports page." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <AdminTable>
        <thead>
          <tr className="border-b border-line">
            <Th>Comment</Th>
            <Th>Episode</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-line">
              <Td>
                <p className="text-xs text-muted">
                  {row.user.displayName} · {new Date(row.createdAt).toLocaleString()}
                  {row.spoiler ? " · spoiler" : ""}
                </p>
                <p className="mt-1 max-w-xl text-sm">{row.body}</p>
              </Td>
              <Td>
                <Link href={`/watch/${row.episode.id}`} className="text-sm hover:text-accent">
                  {row.episode.name}
                </Link>
              </Td>
              <Td className="text-right">
                <AdminButton type="button" variant="danger" className="h-8 px-3 text-xs" onClick={() => void remove(row.id)}>
                  Delete
                </AdminButton>
              </Td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <Td className="text-muted">No comments yet.</Td>
              <Td />
              <Td />
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </main>
  );
}
