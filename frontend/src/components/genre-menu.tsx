"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { api } from "@/lib/client-api";
import { genreKind, type GenreKind } from "@/lib/genre-kinds";
import { cn } from "@/lib/utils";

type Genre = { slug: string; name: string };

const LABELS: Record<GenreKind, string> = {
  genre: "Genres",
  theme: "Themes",
  demographic: "Demographics"
};

export function GenreMenu() {
  const [open, setOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[] | null>(null);

  function toggle() {
    setOpen((value) => !value);
    if (genres) return;
    void api<Genre[]>("/catalog/genres")
      .then((rows) => setGenres(rows))
      .catch(() => setGenres([]));
  }

  const groups: Record<GenreKind, Genre[]> = { genre: [], theme: [], demographic: [] };
  for (const genre of genres ?? []) groups[genreKind(genre.slug)].push(genre);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn("nav-link flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-sm", open && "nav-link-active font-medium")}
      >
        <LayoutGrid className="size-4 shrink-0" />
        Genres
      </button>
      {open ? (
        <div className="mt-1 space-y-3 rounded-[var(--radius-control)] bg-black/10 px-2.5 py-2">
          {(Object.keys(LABELS) as GenreKind[]).map((kind) =>
            groups[kind].length ? (
              <div key={kind}>
                <p className="pb-1 text-[10px] font-semibold tracking-[0.16em] text-[var(--sidebar-muted)] uppercase">{LABELS[kind]}</p>
                <ul className="space-y-0.5">
                  {groups[kind].map((genre) => (
                    <li key={genre.slug}>
                      <Link href={`/browse?include=${genre.slug}`} className="block rounded-md px-2 py-1 text-sm hover:bg-black/10">
                        {genre.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
          {genres && !genres.length ? <p className="text-xs text-[var(--sidebar-muted)]">No genres yet.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
