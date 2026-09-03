import Link from "next/link";

import type { EpisodeCard } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

import { PosterArt } from "./poster-card";
import { SectionHead } from "./section-head";

export function LatestReleaseGrid({
  items,
  headed = true,
  flush = false,
  limit
}: {
  items: EpisodeCard[];
  headed?: boolean;
  flush?: boolean;
  limit?: number;
}) {
  const cards = limit != null ? items.slice(0, limit) : headed ? items.slice(0, flush ? 8 : 6) : items;
  if (!cards.length) return null;

  return (
    <section className={flush ? "" : "page-shell"}>
      {headed ? (
        <SectionHead kicker="Latest" title="Latest releases" href="/latest" hrefLabel="View all" />
      ) : null}
      <div className={cn("grid gap-3", flush ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {cards.map((item) => (
          <Link
            key={item.episodeId}
            href={`/watch/${item.episodeId}`}
            className="group overflow-hidden rounded-xl bg-surface/80 ring-1 ring-white/8"
          >
            <div className="relative aspect-video">
              <PosterArt
                name={item.title.name}
                hue={item.title.hue}
                src={item.title.backdropUrl || item.title.posterUrl}
                className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <span className="absolute top-2 left-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.title.type === "SERIES" ? "TV" : item.title.type}
              </span>
              <span className="absolute right-2 bottom-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
                EP {item.number}
              </span>
            </div>
            <div className="p-2.5">
              <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-accent">{item.title.name}</h3>
              <p className="mt-1 text-[11px] text-muted">
                {item.audioKind === "DUB" ? "Dub" : "Sub"}
                {item.durationSec ? ` · ${Math.round(item.durationSec / 60)}m` : ""}
                {formatRelativeTime(item.airDate) ? ` · ${formatRelativeTime(item.airDate)}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
