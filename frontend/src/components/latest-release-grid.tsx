import Link from "next/link";

import type { EpisodeCard } from "@/lib/types";
import { cn } from "@/lib/utils";

import { PosterArt, PosterHover } from "./poster-card";
import { StatusDot, TitleMeta } from "./title-meta";
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
      <div className={cn("grid gap-x-3.5 gap-y-5", flush ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
        {cards.map((item) => (
          <Link
            key={item.episodeId}
            href={`/watch/${item.episodeId}`}
            className="group"
          >
            <div className="relative aspect-2/3 overflow-hidden rounded-[10px]">
              <PosterArt
                name={item.title.name}
                hue={item.title.hue}
                src={item.title.posterUrl || item.title.backdropUrl}
                className="absolute inset-0"
                overlay={false}
              />
              <PosterHover titleId={item.title.id} />
              <span className="pointer-events-none absolute right-2 bottom-2 z-[2] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                EP {item.number}
              </span>
            </div>
            <h3 className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
              <StatusDot status={item.title.status} />
              <span className="truncate group-hover:text-[#eab308]">{item.title.name}</span>
            </h3>
            <TitleMeta title={item.title} className="mt-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}
