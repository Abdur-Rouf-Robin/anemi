import Link from "next/link";

import type { TitleCard } from "@/lib/types";
import { firstEpisodeId, formatAirTime } from "@/lib/utils";

import { PosterArt, PosterHover } from "./poster-card";
import { StatusDot, TitleMeta } from "./title-meta";
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
          return (
            <Link
              key={title.id}
              href={playId ? `/watch/${playId}` : `/title/${title.slug}`}
              className="group w-[160px] shrink-0 sm:w-[176px]"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded-[10px]">
                <PosterArt
                  name={title.name}
                  hue={title.hue}
                  src={title.posterUrl || title.backdropUrl}
                  className="absolute inset-0"
                  overlay={false}
                />
                <PosterHover titleId={title.id} />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5">
                <StatusDot status={title.status} />
                <span className="truncate text-[13px] font-semibold group-hover:text-[#eab308]">{title.name}</span>
              </p>
              <TitleMeta title={title} className="mt-1" />
              {title.nextAirDate ? (
                <p className="mt-1 text-[11px] text-muted">{formatAirTime(title.nextAirDate)}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
