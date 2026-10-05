"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { genreKind, type GenreKind } from "@/lib/genre-kinds";
import { cn } from "@/lib/utils";

type Genre = { slug: string; name: string };
type Studio = { slug: string; name: string };

const TYPES = [
  { value: "", label: "All" },
  { value: "SERIES", label: "Series" },
  { value: "MOVIE", label: "Movie" },
  { value: "ANIMATION", label: "Animation" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Specials" }
];
const STATUSES = [
  { value: "", label: "All" },
  { value: "AIRING", label: "Airing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "UPCOMING", label: "Upcoming" }
];
const AUDIOS = [
  { value: "", label: "All" },
  { value: "SUB", label: "Original (Sub)" },
  { value: "DUB", label: "Dub" }
];
const SEASONS = [
  { value: "", label: "All" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" }
];
const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Release" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "score", label: "Highest rated" },
  { value: "az", label: "Name (A–Z)" }
];

const YEARS = Array.from({ length: new Date().getFullYear() - 1959 }, (_, index) => String(new Date().getFullYear() - index));

export type FilterState = {
  type?: string;
  sort?: string;
  genre?: string;
  status?: string;
  year?: string;
  season?: string;
  audio?: string;
  studio?: string;
  include?: string;
  exclude?: string;
  match?: string;
  yearFrom?: string;
  yearTo?: string;
  minRatings?: string;
  scoreMin?: string;
  scoreMax?: string;
  hasEpisodes?: string;
  q?: string;
};

function list(value?: string) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function toggleSlug(current: string[], slug: string) {
  return current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
}

export function FilterDrawer({
  path,
  params,
  genres,
  studios
}: {
  path: string;
  params: FilterState;
  genres: Genre[];
  studios: Studio[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bucket, setBucket] = useState<"include" | "exclude">("include");
  const initialInclude = list(params.include || params.genre);
  const [draft, setDraft] = useState({
    type: params.type ?? "",
    status: params.status ?? "",
    season: params.season ?? "",
    audio: params.audio ?? "",
    sort: params.sort ?? "popular",
    studio: params.studio ?? "",
    match: params.match === "all" ? "all" : "any",
    yearFrom: params.yearFrom ?? params.year ?? "",
    yearTo: params.yearTo ?? params.year ?? "",
    minRatings: params.minRatings ?? "",
    scoreMin: params.scoreMin ?? "",
    scoreMax: params.scoreMax ?? "",
    hasEpisodes: params.hasEpisodes === "1",
    include: initialInclude,
    exclude: list(params.exclude)
  });

  const groups = useMemo(() => {
    const buckets: Record<GenreKind, Genre[]> = { genre: [], theme: [], demographic: [] };
    for (const genre of genres) buckets[genreKind(genre.slug)].push(genre);
    return buckets;
  }, [genres]);

  const names = useMemo(() => new Map(genres.map((genre) => [genre.slug, genre.name])), [genres]);

  function apply() {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (draft.type) query.set("type", draft.type);
    if (draft.status) query.set("status", draft.status);
    if (draft.season) query.set("season", draft.season);
    if (draft.audio) query.set("audio", draft.audio);
    if (draft.sort && draft.sort !== "popular") query.set("sort", draft.sort);
    if (draft.studio) query.set("studio", draft.studio);
    if (draft.include.length) query.set("include", draft.include.join(","));
    if (draft.exclude.length) query.set("exclude", draft.exclude.join(","));
    if (draft.include.length > 1 && draft.match === "all") query.set("match", "all");
    if (draft.yearFrom) query.set("yearFrom", draft.yearFrom);
    if (draft.yearTo) query.set("yearTo", draft.yearTo);
    if (draft.minRatings) query.set("minRatings", draft.minRatings);
    if (draft.scoreMin) query.set("scoreMin", draft.scoreMin);
    if (draft.scoreMax) query.set("scoreMax", draft.scoreMax);
    if (draft.hasEpisodes) query.set("hasEpisodes", "1");
    const qs = query.toString();
    setOpen(false);
    router.push(qs ? `${path}?${qs}` : path);
  }

  function clear() {
    setOpen(false);
    router.push(params.q ? `${path}?q=${encodeURIComponent(params.q)}` : path);
  }

  function chip(slug: string) {
    const included = draft.include.includes(slug);
    const excluded = draft.exclude.includes(slug);
    return (
      <button
        key={slug}
        type="button"
        onClick={() => {
          if (bucket === "include") {
            setDraft((prev) => ({
              ...prev,
              include: toggleSlug(prev.include, slug),
              exclude: prev.exclude.filter((item) => item !== slug)
            }));
          } else {
            setDraft((prev) => ({
              ...prev,
              exclude: toggleSlug(prev.exclude, slug),
              include: prev.include.filter((item) => item !== slug)
            }));
          }
        }}
        className={cn(
          "rounded-full px-3 py-1 text-sm ring-1 ring-line",
          included && "chip-on",
          excluded && "bg-elevated text-ink line-through",
          !included && !excluded && "bg-elevated text-muted hover:text-ink"
        )}
      >
        {names.get(slug) ?? slug}
      </button>
    );
  }

  const applied = [
    ...list(params.include || params.genre).map((slug) => names.get(slug) ?? slug),
    ...list(params.exclude).map((slug) => `Exclude ${names.get(slug) ?? slug}`)
  ];
  if (params.type) applied.push(params.type);
  if (params.status) applied.push(params.status);
  if (params.audio) applied.push(params.audio);
  if (params.season) applied.push(params.season);
  if (params.studio) applied.push(params.studio);
  if (params.yearFrom || params.yearTo || params.year) {
    applied.push(`${params.yearFrom || params.year || "…"}–${params.yearTo || params.year || "…"}`);
  }
  if (params.hasEpisodes === "1") applied.push("Has episodes");
  if (params.minRatings) applied.push(`${params.minRatings}+ ratings`);
  if (params.scoreMin || params.scoreMax) applied.push(`Score ${params.scoreMin || 1}–${params.scoreMax || 10}`);

  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {applied.length ? (
          <button type="button" onClick={clear} className="text-sm text-muted hover:text-ink">
            Clear filters
          </button>
        ) : null}
        <button type="button" className="filter-btn" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
      </div>
      {applied.length ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {applied.map((label) => (
            <span key={label} className="rounded-full bg-elevated px-3 py-1 text-sm ring-1 ring-line">
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-canvas">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Filters</p>
                <p className="text-xs text-muted">Refine the catalog</p>
              </div>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Sort</span>
                <select className="field-input" value={draft.sort} onChange={(event) => setDraft((prev) => ({ ...prev, sort: event.target.value }))}>
                  {SORTS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Has episodes</span>
                <input
                  type="checkbox"
                  checked={draft.hasEpisodes}
                  onChange={(event) => setDraft((prev) => ({ ...prev, hasEpisodes: event.target.checked }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" value={draft.type} options={TYPES} onChange={(type) => setDraft((prev) => ({ ...prev, type }))} />
                <Field label="Status" value={draft.status} options={STATUSES} onChange={(status) => setDraft((prev) => ({ ...prev, status }))} />
                <Field label="Season" value={draft.season} options={SEASONS} onChange={(season) => setDraft((prev) => ({ ...prev, season }))} />
                <Field label="Audio" value={draft.audio} options={AUDIOS} onChange={(audio) => setDraft((prev) => ({ ...prev, audio }))} />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Score</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    Min
                    <input className="field-input mt-1" inputMode="numeric" value={draft.scoreMin} placeholder="1" onChange={(event) => setDraft((prev) => ({ ...prev, scoreMin: event.target.value.replace(/\D/g, "").slice(0, 2) }))} />
                  </label>
                  <label className="text-sm">
                    Max
                    <input className="field-input mt-1" inputMode="numeric" value={draft.scoreMax} placeholder="10" onChange={(event) => setDraft((prev) => ({ ...prev, scoreMax: event.target.value.replace(/\D/g, "").slice(0, 2) }))} />
                  </label>
                </div>
                <label className="mt-3 block text-sm">
                  Minimum ratings
                  <input className="field-input mt-1" inputMode="numeric" value={draft.minRatings} placeholder="Any" onChange={(event) => setDraft((prev) => ({ ...prev, minRatings: event.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="button" className={cn("rounded-full px-3 py-1 text-sm ring-1 ring-line", bucket === "include" && "chip-on")} onClick={() => setBucket("include")}>
                  Include
                </button>
                <button type="button" className={cn("rounded-full px-3 py-1 text-sm ring-1 ring-line", bucket === "exclude" && "chip-on")} onClick={() => setBucket("exclude")}>
                  Exclude
                </button>
                <button type="button" className={cn("ml-auto rounded-full px-3 py-1 text-sm ring-1 ring-line", draft.match === "all" && "chip-on")} onClick={() => setDraft((prev) => ({ ...prev, match: prev.match === "all" ? "any" : "all" }))}>
                  Match {draft.match === "all" ? "all" : "any"}
                </button>
              </div>
              {(["genre", "theme", "demographic"] as const).map((kind) =>
                groups[kind].length ? (
                  <div key={kind}>
                    <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                      {kind === "genre" ? "Genres" : kind === "theme" ? "Themes" : "Demographics"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">{groups[kind].map((genre) => chip(genre.slug))}</div>
                  </div>
                ) : null
              )}
              <label className="block text-sm">
                <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Studio</span>
                <select className="field-input" value={draft.studio} onChange={(event) => setDraft((prev) => ({ ...prev, studio: event.target.value }))}>
                  <option value="">All</option>
                  {studios.map((studio) => (
                    <option key={studio.slug} value={studio.slug}>{studio.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year from" value={draft.yearFrom} options={[{ value: "", label: "Any" }, ...YEARS.map((year) => ({ value: year, label: year }))]} onChange={(yearFrom) => setDraft((prev) => ({ ...prev, yearFrom }))} />
                <Field label="Year to" value={draft.yearTo} options={[{ value: "", label: "Any" }, ...YEARS.map((year) => ({ value: year, label: year }))]} onChange={(yearTo) => setDraft((prev) => ({ ...prev, yearTo }))} />
              </div>
            </div>
            <div className="flex gap-2 border-t border-line px-4 py-3">
              <button type="button" className="btn h-10 px-4" onClick={clear}>Reset</button>
              <button type="button" className="btn btn-primary h-10 flex-1" onClick={apply}>Apply filters</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</span>
      <select className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={`${label}-${option.value || "all"}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
