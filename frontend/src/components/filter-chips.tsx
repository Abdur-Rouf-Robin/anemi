"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

const TYPES = [
  { value: "", label: "All" },
  { value: "SERIES", label: "Series" },
  { value: "MOVIE", label: "Movie" },
  { value: "ANIMATION", label: "Animation" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Specials" }
];
const SORTS = [
  { value: "popular", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Updated" },
  { value: "score", label: "Highest rated" },
  { value: "az", label: "A–Z" }
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
const COLLECTIONS = [
  { type: "MOVIE", status: "", audio: "", label: "Movies" },
  { type: "SERIES", status: "", audio: "", label: "Series" },
  { type: "ANIMATION", status: "", audio: "", label: "Animation" },
  { type: "", status: "UPCOMING", audio: "", label: "Coming soon" },
  { type: "", status: "", audio: "SUB", label: "Sub" },
  { type: "", status: "", audio: "DUB", label: "Dub" }
];

const YEARS = ["", ...Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i))];

export function FilterChips({
  path,
  q,
  type,
  sort,
  genre,
  status,
  year,
  season,
  audio,
  genres = []
}: {
  path: string;
  q?: string;
  type?: string;
  sort?: string;
  genre?: string;
  status?: string;
  year?: string;
  season?: string;
  audio?: string;
  genres?: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const defaultSort = q ? "relevance" : "popular";
  const current = { type, sort: sort ?? defaultSort, genre, status, year, season, audio };

  function href(next: Partial<typeof current> & { q?: string }) {
    const params = new URLSearchParams();
    const merged = { q: q ?? "", ...current, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.type) params.set("type", merged.type);
    if (merged.sort && merged.sort !== defaultSort) params.set("sort", merged.sort);
    if (merged.genre) params.set("genre", merged.genre);
    if (merged.status) params.set("status", merged.status);
    if (merged.year) params.set("year", merged.year);
    if (merged.season) params.set("season", merged.season);
    if (merged.audio) params.set("audio", merged.audio);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  function go(key: keyof typeof current, value: string) {
    router.push(href({ [key]: value }));
  }

  const fields = [
    { key: "type" as const, label: "Type", value: type ?? "", options: TYPES },
    { key: "status" as const, label: "Status", value: status ?? "", options: STATUSES },
    { key: "season" as const, label: "Season", value: season ?? "", options: SEASONS },
    { key: "audio" as const, label: "Language", value: audio ?? "", options: AUDIOS },
    { key: "sort" as const, label: "Sort", value: sort ?? defaultSort, options: q ? [{ value: "relevance", label: "Relevance" }, ...SORTS] : SORTS },
    {
      key: "year" as const,
      label: "Year",
      value: year ?? "",
      options: YEARS.map((item) => ({ value: item, label: item || "All" }))
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {COLLECTIONS.map((item) => {
          const active =
            (item.status && status === item.status && !type && !audio) ||
            (item.type && type === item.type && !status && !audio) ||
            (item.audio && audio === item.audio && !type && !status);
          return (
            <Link
              key={item.label}
              href={href({ type: item.type, status: item.status, audio: item.audio })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/10",
                active ? "chip-on" : "bg-elevated text-muted hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
              {field.label}
            </span>
            <select
              value={field.value}
              onChange={(event) => go(field.key, event.target.value)}
              className="field-input"
            >
              {field.options.map((option) => (
                <option key={`${field.key}-${option.value || "all"}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {genres.length ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Genres</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((item) => (
              <Link
                key={item.slug}
                href={href({ genre: genre === item.slug ? "" : item.slug })}
                className={cn(
                  "rounded-full px-3 py-1 text-sm ring-1 ring-white/10",
                  genre === item.slug ? "chip-on" : "bg-elevated text-muted hover:text-ink"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
