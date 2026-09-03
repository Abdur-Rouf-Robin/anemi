import Link from "next/link";

import type { TitleCard } from "@/lib/types";
import { firstEpisodeId, formatAirTime } from "@/lib/utils";

import { PosterArt } from "./poster-card";
import { SectionHead } from "./section-head";

export function AiringSoonRail({ items, flush = false }: { items: TitleCard[]; flush?: boolean }) {
  const cards = items.filter((item) => item.nextAirDate).slice(0, 8);
  if (!cards.length) return null;

  return (
    <section className={flush ? "" : "page-shell"}>
      <SectionHead kicker="Schedule / Next" title="Airing soon" href="/schedule" hrefLabel="View full schedule" />
      <p className="-mt-2 mb-4 text-sm text-muted">
        Times are shown in your local timezone. Availability follows the catalog, not a broadcast scrape.
      </p>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {cards.map((title) => {
          const playId = firstEpisodeId(title);
          const date = title.nextAirDate ? new Date(title.nextAirDate) : null;
          const stamp = date
            ? date.toLocaleString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit"
              })
            : "Soon";
          return (
            <Link
              key={title.id}
              href={playId ? `/watch/${playId}` : `/title/${title.slug}`}
              className="card-panel w-[220px] shrink-0 overflow-hidden sm:w-[240px]"
            >
              <div className="relative aspect-video">
                <PosterArt
                  name={title.name}
                  hue={title.hue}
                  src={title.backdropUrl || title.posterUrl}
                  className="absolute inset-0"
                />
                <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {stamp}
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-semibold">{title.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {title.episodeCount ? `EP ${title.episodeCount}` : title.type}
                  {title.nextAirDate ? ` · ${formatAirTime(title.nextAirDate)}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
