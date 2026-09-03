"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, adminControl } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { toDatetimeLocal } from "@/lib/utils";

type Row = {
  id: string;
  number: number;
  name: string;
  audioKind: string;
  language: string;
  airDate: string | null;
  publish: string;
  season: { number: number; title: { id: string; name: string; status: string } };
};

export default function AdminSchedulePage() {
  const [days, setDays] = useState<{ date: string; items: Row[] }[]>([]);
  const [missing, setMissing] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const data = await api<{ days: { date: string; items: Row[] }[]; missing: Row[] }>("/admin/schedule");
    setDays(data.days);
    setMissing(data.missing);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function saveAir(id: string, airDate: string, name: string) {
    setError("");
    try {
      await api(`/admin/episodes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, airDate: airDate ? new Date(airDate).toISOString() : null })
      });
      setNote("Air time saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save air time");
    }
  }

  return (
    <main className="space-y-6">
      <AdminHeader
        title="Schedule"
        description="Episode air dates power the public week calendar, Airing soon, and the weekly newsletter."
        action={
          <Link href="/schedule" className="text-sm text-accent">
            View public schedule
          </Link>
        }
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {note ? <AdminNotice tone="ok">{note}</AdminNotice> : null}

      <AdminCard>
        <h2 className="text-sm font-semibold">Dated in the next 3 weeks</h2>
        <p className="mt-1 text-sm text-muted">Set a time, not just a day, so the 08:00-style list is accurate.</p>
        <div className="mt-4 space-y-6">
          {days.map((day) => (
            <section key={day.date}>
              <h3 className="text-sm font-medium">{day.date}</h3>
              <ul className="mt-2 divide-y divide-line">
                {day.items.map((item) => (
                  <AirRow key={item.id} item={item} onSave={saveAir} />
                ))}
              </ul>
            </section>
          ))}
          {!days.length ? <p className="text-sm text-muted">No dated episodes yet. Add air times below or on a title.</p> : null}
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-semibold">Published airing/upcoming without a time</h2>
        <p className="mt-1 text-sm text-muted">These will not appear on the public schedule until they have an air date.</p>
        <ul className="mt-4 divide-y divide-line">
          {missing.map((item) => (
            <AirRow key={item.id} item={item} onSave={saveAir} />
          ))}
          {!missing.length ? <li className="py-2 text-sm text-muted">All published upcoming/airing episodes have dates.</li> : null}
        </ul>
      </AdminCard>
    </main>
  );
}

function AirRow({
  item,
  onSave
}: {
  item: Row;
  onSave: (id: string, airDate: string, name: string) => Promise<void>;
}) {
  const [value, setValue] = useState(toDatetimeLocal(item.airDate));
  useEffect(() => {
    setValue(toDatetimeLocal(item.airDate));
  }, [item.airDate]);

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.season.title.name}</p>
        <p className="text-xs text-muted">
          S{item.season.number} E{item.number} · {item.name} · {item.audioKind}
          {item.language ? ` · ${item.language}` : ""}
        </p>
      </div>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={`${adminControl} w-auto`}
      />
      <AdminButton type="button" variant="secondary" className="h-9 px-3 text-xs" onClick={() => void onSave(item.id, value, item.name)}>
        Save
      </AdminButton>
      <Link href={`/admin/titles/${item.season.title.id}`} className="text-xs text-accent">
        Title
      </Link>
    </li>
  );
}
