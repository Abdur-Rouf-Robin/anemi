"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminCard, AdminHeader, AdminNotice, Field, adminControl } from "@/components/admin/ui";
import { AdminOnly } from "@/components/admin-only";
import { api } from "@/lib/client-api";
import { HOME_SECTION_META, emptyHomeConfig, normalizeHomeConfig, type HomeConfig } from "@/lib/home-config";

type PickTitle = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  publish: string;
  spotlight: boolean;
  year: number | null;
};

type HomePayload = {
  homeConfig: HomeConfig;
  communityGuidelines: string | null;
  titles: PickTitle[];
  genres: { slug: string; name: string }[];
};

export default function AdminHomePage() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [config, setConfig] = useState<HomeConfig>(emptyHomeConfig());
  const [guidelines, setGuidelines] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<HomePayload>("/admin/home")
      .then((payload) => {
        setData(payload);
        setConfig(normalizeHomeConfig(payload.homeConfig));
        setGuidelines(payload.communityGuidelines ?? "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setNote("");
    try {
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ homeConfig: config, communityGuidelines: guidelines })
      });
      setNote("Homepage saved. Open the public site to check it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!data && !error) {
    return (
      <AdminOnly>
        <p className="text-sm text-muted">Loading…</p>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
    <main className="space-y-6">
      <AdminHeader
        title="Homepage"
        description="Choose what the public home shows: hero, films, genre tabs, schedule, and which rails are on."
        action={
          <Link href="/" className="text-sm text-accent">
            View site
          </Link>
        }
      />
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {note ? <AdminNotice tone="ok">{note}</AdminNotice> : null}

      <AdminCard>
        <h2 className="text-sm font-semibold">Sections on home</h2>
        <p className="mt-1 text-sm text-muted">Turn a block off without deleting the catalog behind it.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {HOME_SECTION_META.map((item) => (
            <label key={item.key} className="flex items-start gap-2 rounded-xl bg-elevated/50 px-3 py-2 text-sm ring-1 ring-white/8">
              <input
                type="checkbox"
                checked={config.sections[item.key]}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    sections: { ...prev.sections, [item.key]: event.target.checked }
                  }))
                }
              />
              <span>
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{item.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <Picker
          title="Hero spotlight"
          hint="Order is the carousel order. Empty = titles with Spotlight checked."
          titles={data?.titles ?? []}
          selected={config.spotlightIds}
          onChange={(spotlightIds) => setConfig((prev) => ({ ...prev, spotlightIds }))}
        />
        <Picker
          title="Featured films queue"
          hint="Programme queue under the featured film. Empty = latest movies."
          titles={(data?.titles ?? []).filter((title) => title.type === "MOVIE")}
          selected={config.featuredIds}
          onChange={(featuredIds) => setConfig((prev) => ({ ...prev, featuredIds }))}
          fallbackHint="No movies yet. Create a Movie title, then pick it here."
        />
      </div>

      <AdminCard>
        <h2 className="text-sm font-semibold">Genre tabs</h2>
        <p className="mt-1 text-sm text-muted">Up to 8 genres on home. Empty = first six alphabetically.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(data?.genres ?? []).map((genre) => {
            const on = config.genreSlugs.includes(genre.slug);
            return (
              <button
                key={genre.slug}
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    genreSlugs: on
                      ? prev.genreSlugs.filter((slug) => slug !== genre.slug)
                      : [...prev.genreSlugs, genre.slug].slice(0, 8)
                  }))
                }
                className={`rounded-full px-3 py-1 text-sm ring-1 ring-white/10 ${on ? "chip-on" : "bg-elevated text-muted"}`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard>
        <Field label="Watch next seed title">
          <select
            value={config.watchNextTitleId ?? ""}
            onChange={(event) => setConfig((prev) => ({ ...prev, watchNextTitleId: event.target.value || null }))}
            className={adminControl}
          >
            <option value="">Automatic (continue watching / trending)</option>
            {(data?.titles ?? [])
              .filter((title) => title.publish === "PUBLISHED")
              .map((title) => (
                <option key={title.id} value={title.id}>
                  {title.name}
                </option>
              ))}
          </select>
        </Field>
        <p className="mt-2 text-xs text-muted">Related titles use this show’s genres and studio.</p>
      </AdminCard>

      <AdminCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Staff collections</h2>
            <p className="mt-1 text-sm text-muted">Up to 8 shelves on home. Each can hold 24 published titles.</p>
          </div>
          <AdminButton
            type="button"
            variant="secondary"
            disabled={config.collections.length >= 8}
            onClick={() =>
              setConfig((prev) => {
                if (prev.collections.length >= 8) return prev;
                const id = `col-${Date.now().toString(36)}`;
                return {
                  ...prev,
                  collections: [...prev.collections, { id, name: "Start here", slug: `start-here-${id.slice(-4)}`, titleIds: [] }]
                };
              })
            }
          >
            Add shelf
          </AdminButton>
        </div>
        <div className="mt-4 space-y-6">
          {config.collections.map((shelf, index) => (
            <div key={shelf.id} className="rounded-xl bg-elevated/50 p-4 ring-1 ring-white/8">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Shelf {index + 1}</p>
                <button
                  type="button"
                  className="text-xs text-red-400"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      collections: prev.collections.filter((row) => row.id !== shelf.id)
                    }))
                  }
                >
                  Remove shelf
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name">
                  <input
                    value={shelf.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setConfig((prev) => ({
                        ...prev,
                        collections: prev.collections.map((row) => (row.id === shelf.id ? { ...row, name } : row))
                      }));
                    }}
                    className={adminControl}
                  />
                </Field>
                <Field label="URL slug">
                  <input
                    value={shelf.slug}
                    onChange={(event) => {
                      const slug = event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
                      setConfig((prev) => ({
                        ...prev,
                        collections: prev.collections.map((row) => (row.id === shelf.id ? { ...row, slug } : row))
                      }));
                    }}
                    className={adminControl}
                  />
                </Field>
              </div>
              <Picker
                title="Titles on this shelf"
                hint="Order is the rail order. Unpublished titles are hidden on the public site."
                titles={data?.titles ?? []}
                selected={shelf.titleIds}
                onChange={(titleIds) =>
                  setConfig((prev) => ({
                    ...prev,
                    collections: prev.collections.map((row) => (row.id === shelf.id ? { ...row, titleIds } : row))
                  }))
                }
                limit={24}
                embedded
                fallbackHint="Add published titles to show this shelf on home."
              />
            </div>
          ))}
          {!config.collections.length ? <p className="text-sm text-muted">No shelves yet. Add one, then pick titles.</p> : null}
        </div>
      </AdminCard>

      <AdminCard>
        <Field label="Community guidelines (watch comments tab)">
          <textarea
            value={guidelines}
            onChange={(event) => setGuidelines(event.target.value)}
            placeholder="Be kind. Mark spoilers. No links to unauthorized copies."
            className="field-input min-h-32 py-2"
          />
        </Field>
      </AdminCard>

      <div className="flex flex-wrap gap-2">
        <AdminButton type="button" disabled={saving} onClick={() => void save()}>
          Save homepage
        </AdminButton>
        <Link href="/admin/schedule" className="inline-flex h-10 items-center rounded-full bg-elevated px-4 text-sm font-semibold ring-1 ring-white/10">
          Edit schedule
        </Link>
        <Link href="/admin/titles" className="inline-flex h-10 items-center rounded-full px-4 text-sm text-muted hover:text-ink">
          Titles
        </Link>
      </div>
    </main>
    </AdminOnly>
  );
}

function Picker({
  title,
  hint,
  titles,
  selected,
  onChange,
  fallbackHint,
  limit = 8,
  embedded
}: {
  title: string;
  hint: string;
  titles: PickTitle[];
  selected: string[];
  onChange: (ids: string[]) => void;
  fallbackHint?: string;
  limit?: number;
  embedded?: boolean;
}) {
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(titles.map((item) => [item.id, item])), [titles]);
  const hits = titles
    .filter((item) => item.name.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((item) => !selected.includes(item.id))
    .slice(0, 8);

  function move(id: string, dir: -1 | 1) {
    const index = selected.indexOf(id);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= selected.length) return;
    const copy = [...selected];
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    onChange(copy);
  }

  const body = (
    <>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <ol className="mt-3 space-y-2">
        {selected.map((id, index) => {
          const item = byId.get(id);
          return (
            <li key={id} className="flex items-center gap-2 rounded-xl bg-elevated/60 px-3 py-2 text-sm">
              <span className="w-5 text-xs text-muted">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate">{item?.name ?? id}</span>
              <button type="button" className="text-xs text-muted" onClick={() => move(id, -1)}>
                Up
              </button>
              <button type="button" className="text-xs text-muted" onClick={() => move(id, 1)}>
                Down
              </button>
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => onChange(selected.filter((value) => value !== id))}
              >
                Remove
              </button>
            </li>
          );
        })}
        {!selected.length ? <li className="text-sm text-muted">{fallbackHint ?? "Using automatic catalog order."}</li> : null}
      </ol>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Add a published title"
        className={`${adminControl} mt-3`}
      />
      {q.trim() ? (
        <ul className="mt-2 overflow-hidden rounded-xl ring-1 ring-white/10">
          {hits.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-elevated"
                onClick={() => {
                  onChange([...selected, item.id].slice(0, limit));
                  setQ("");
                }}
              >
                <span>{item.name}</span>
                <span className="text-xs text-muted">{item.publish}</span>
              </button>
            </li>
          ))}
          {!hits.length ? <li className="px-3 py-2 text-sm text-muted">No matches.</li> : null}
        </ul>
      ) : null}
    </>
  );

  if (embedded) return <div className="mt-4">{body}</div>;
  return <AdminCard>{body}</AdminCard>;
}
