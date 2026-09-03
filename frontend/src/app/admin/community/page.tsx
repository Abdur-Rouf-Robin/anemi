"use client";

import { useEffect, useState } from "react";

import { AdminBadge, AdminButton, AdminCard, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Post = {
  id: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  user: { displayName: string; email: string };
};

export default function AdminCommunityPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<Post[]>("/admin/posts"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await api(`/admin/posts/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <AdminHeader title="Community" description="Moderate board posts." />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <div className="space-y-3">
        {items.map((post) => (
          <AdminCard key={post.id}>
            <div className="flex items-center gap-2">
              <AdminBadge>{post.category}</AdminBadge>
              <span className="text-xs text-muted">{post.user.displayName}</span>
            </div>
            <h2 className="mt-2 font-medium">{post.title}</h2>
            <p className="mt-1 text-sm text-muted">{post.body}</p>
            <AdminButton type="button" variant="danger" className="mt-4 h-8 px-3 text-xs" onClick={() => void remove(post.id)}>
              Delete
            </AdminButton>
          </AdminCard>
        ))}
        {!items.length ? <p className="text-sm text-muted">No posts.</p> : null}
      </div>
    </main>
  );
}
