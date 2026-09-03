"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminHeader,
  AdminNotice,
  AdminTable,
  Th,
  Td,
  adminControl
} from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type AdminTitle = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  publish: string;
  year: number | null;
};

export default function AdminTitlesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminTitle[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    try {
      setItems(await api<AdminTitle[]>("/admin/titles"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load titles");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      const created = await api<{ id: string }>("/admin/titles", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          type: form.get("type"),
          status: "UPCOMING",
          synopsis: "Add a synopsis in the title editor.",
          year: new Date().getFullYear()
        })
      });
      router.push(`/admin/titles/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <AdminHeader
        title="Titles"
        description="A title is the show. Homepage rails and week times are under Homepage and Schedule."
      />
      <AdminCard className="mb-6">
        <p className="mb-4 text-sm text-muted">
          Title → Season → Episode → Video file. A movie still uses one season and one episode. Sub and Dub are two
          episodes with the same number.
        </p>
        <form onSubmit={(event) => void create(event)} className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1">
            <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted uppercase">New title</span>
            <input name="name" required placeholder="Harbor Lights" className={adminControl} />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted uppercase">Type</span>
            <select name="type" className={adminControl}>
              <option value="SERIES">Series</option>
              <option value="MOVIE">Movie</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
              <option value="SPECIAL">Special</option>
            </select>
          </label>
          <AdminButton type="submit" disabled={pending}>
            Create
          </AdminButton>
        </form>
      </AdminCard>
      {error ? <div className="mb-4"><AdminNotice>{error}</AdminNotice></div> : null}
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Filter titles"
        className={`${adminControl} mb-4 max-w-sm`}
        aria-label="Filter titles"
      />
      <AdminTable>
        <thead>
          <tr className="border-b border-line">
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Year</Th>
            <Th className="text-right"> </Th>
          </tr>
        </thead>
        <tbody>
          {items
            .filter((title) => title.name.toLowerCase().includes(q.trim().toLowerCase()))
            .map((title) => (
            <tr key={title.id} className="border-t border-line hover:bg-elevated/40">
              <Td>
                <Link href={`/admin/titles/${title.id}`} className="font-medium hover:text-accent">
                  {title.name}
                </Link>
              </Td>
              <Td className="capitalize text-muted">{title.type.toLowerCase()}</Td>
              <Td>
                <AdminBadge tone={title.publish === "PUBLISHED" ? "ok" : "muted"}>{title.publish}</AdminBadge>
              </Td>
              <Td className="text-muted">{title.year}</Td>
              <Td className="text-right">
                <Link href={`/admin/titles/${title.id}`} className="text-xs font-medium text-accent">
                  Edit
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      {!items.length ? (
        <p className="mt-6 text-sm text-muted">No titles yet. Create one above — Title → Season → Episode → file.</p>
      ) : null}
    </main>
  );
}
