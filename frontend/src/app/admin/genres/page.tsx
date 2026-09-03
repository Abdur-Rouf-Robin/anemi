"use client";

import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, adminControl } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Genre = { id: string; slug: string; name: string; _count?: { titles: number } };

export default function AdminGenresPage() {
  const [items, setItems] = useState<Genre[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await api<Genre[]>("/admin/genres"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    await api("/admin/genres", { method: "POST", body: JSON.stringify({ name }) });
    form.reset();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this genre?")) return;
    await api(`/admin/genres/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <AdminHeader title="Genres" description="Used in browse filters and the header genre menu." />
      <AdminCard className="mb-6">
        <form onSubmit={(event) => void create(event)} className="flex flex-wrap gap-3">
          <input name="name" required placeholder="Genre name" className={`${adminControl} max-w-xs`} />
          <AdminButton type="submit">Add genre</AdminButton>
        </form>
      </AdminCard>
      {error ? <div className="mb-4"><AdminNotice>{error}</AdminNotice></div> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((genre) => (
          <AdminCard key={genre.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{genre.name}</p>
              <p className="text-xs text-muted">
                {genre.slug} · {genre._count?.titles ?? 0} titles
              </p>
            </div>
            <AdminButton type="button" variant="danger" className="h-8 px-3 text-xs" onClick={() => void remove(genre.id)}>
              Delete
            </AdminButton>
          </AdminCard>
        ))}
      </div>
    </main>
  );
}
