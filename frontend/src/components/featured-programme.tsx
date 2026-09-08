"use client";

import Link from "next/link";
import { useState } from "react";

import type { TitleCard } from "@/lib/types";
import { cn, firstEpisodeId, formatCount, titleTypeLabel } from "@/lib/utils";

import { PosterArt } from "./poster-card";
import { TitleMeta } from "./title-meta";
import { TitleActions } from "./title-actions";

export function FeaturedProgramme({ items }: { items: TitleCard[] }) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const title = items[index] ?? items[0];
  const playId = firstEpisodeId(title);
  const queue = items.slice(0, 5);

  return (
    <section className="page-shell">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Featured films</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Featured programme</h2>
        </div>
        <Link href="/browse?type=MOVIE" className="text-xs font-semibold tracking-wide text-muted uppercase hover:text-accent">
          View full library →
        </Link>
      </div>
      <p className="-mt-1 mb-4 max-w-xl text-sm text-muted">
        Popular films for your next long watch, ranked from the catalog.
      </p>
      <div className="card-panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <PosterArt
            name={title.name}
            hue={title.hue}
            src={title.posterUrl || title.backdropUrl}
            className="aspect-2/3 w-full lg:aspect-auto lg:min-h-[420px]"
          />
          <div className="flex flex-col p-5 sm:p-8">
            <p className="section-kicker">
              Programme {String(index + 1).padStart(2, "0")}
              {title.status === "AIRING" ? " · Now showing" : ""}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">{title.name}</h2>
            <TitleMeta title={title} className="mt-2" />
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              {[
                ["Format", titleTypeLabel(title.type)],
                ["Year", title.year ? String(title.year) : "—"],
                ["Views", formatCount(title.viewCount)],
                ["Audio", [title.subCount ? "CC" : null, title.dubCount ? "DUB" : null].filter(Boolean).join(" · ") || "—"]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-semibold tracking-wider text-muted uppercase">{label}</dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {title.synopsis ? <p className="mt-4 line-clamp-4 max-w-2xl text-sm text-muted">{title.synopsis}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {playId ? (
                <Link
                  href={`/watch/${playId}`}
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink"
                >
                  Watch
                </Link>
              ) : (
                <span className="rounded-full bg-elevated px-6 py-2.5 text-sm text-muted ring-1 ring-line">
                  Not available yet
                </span>
              )}
              {title.id ? <TitleActions titleId={title.id} compact /> : null}
            </div>
            {queue.length > 1 ? (
              <div className="mt-8">
                <p className="section-kicker">Programme queue</p>
                <div className="mt-3 no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {queue.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        "w-28 shrink-0 text-left",
                        i === index ? "opacity-100" : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <PosterArt
                        name={item.name}
                        hue={item.hue}
                        src={item.posterUrl}
                        className={cn("aspect-2/3 rounded-xl", i === index && "ring-2 ring-accent")}
                      />
                      <p className="mt-1.5 truncate text-[11px] font-semibold text-accent">
                        Popular #{String(i + 1).padStart(2, "0")}
                      </p>
                      <p className="truncate text-xs">{item.name}</p>
                      <TitleMeta title={item} className="mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
