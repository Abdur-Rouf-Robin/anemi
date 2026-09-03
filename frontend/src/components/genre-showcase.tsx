"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/client-api";
import type { TitleCard } from "@/lib/types";
import { cn } from "@/lib/utils";

import { PosterCard } from "./poster-card";
import { SectionHead } from "./section-head";

export function GenreShowcase({ genres, flush = false }: { genres: { slug: string; name: string }[]; flush?: boolean }) {
  const tabs = genres.slice(0, 8);
  const [active, setActive] = useState(tabs[0]?.slug ?? "");
  const [items, setItems] = useState<TitleCard[]>([]);

  useEffect(() => {
    if (!active) return;
    void api<{ items: TitleCard[] }>(`/catalog/titles?genre=${encodeURIComponent(active)}&take=8`)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, [active]);

  if (!tabs.length) return null;
  const current = tabs.find((genre) => genre.slug === active) ?? tabs[0];

  return (
    <section className={flush ? "" : "page-shell"}>
      <SectionHead kicker="Browse / Genre" title="Browse by genre" href="/browse" hrefLabel="Browse all" />
      <p className="-mt-2 mb-4 text-sm text-muted">Choose a genre to explore titles from the catalog.</p>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/8">
        {tabs.map((genre) => (
          <button
            key={genre.slug}
            type="button"
            onClick={() => setActive(genre.slug)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wider uppercase",
              genre.slug === active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {genre.name}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="section-kicker">
          {current?.name} · {items.length} picks
        </p>
        {current ? (
          <Link href={`/browse?genre=${current.slug}`} className="text-xs font-semibold text-muted uppercase hover:text-accent">
            Browse all {current.name} →
          </Link>
        ) : null}
      </div>
      <div className="mt-4 no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {items.map((title) => (
          <PosterCard key={title.id} title={title} />
        ))}
        {!items.length ? <p className="text-sm text-muted">Nothing in this genre yet.</p> : null}
      </div>
    </section>
  );
}
