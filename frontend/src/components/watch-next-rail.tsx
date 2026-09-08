import Link from "next/link";

import type { TitleCard } from "@/lib/types";
import { firstEpisodeId } from "@/lib/utils";

import { PosterArt, PosterHover } from "./poster-card";
import { StatusDot, TitleMeta } from "./title-meta";
import { SectionHead } from "./section-head";

export function WatchNextRail({
  items,
  name,
  flush
}: {
  items: TitleCard[];
  studio?: string | null;
  name?: string;
  flush?: boolean;
}) {
  const cards = items.slice(0, 6);
  if (!cards.length) return null;
  const shell = flush ? "" : "page-shell";

  return (
    <section className={shell || undefined}>
      <SectionHead
        kicker={name ? `If you like “${name}”` : "More to watch"}
        title="Watch next"
        href="/discover"
        hrefLabel="Discover more"
      />
      <p className="-mt-2 mb-4 text-sm text-muted">Titles with a similar genre, studio, or era.</p>
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
                <PosterArt name={title.name} hue={title.hue} src={title.posterUrl} className="absolute inset-0" overlay={false} />
                <PosterHover titleId={title.id} />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5">
                <StatusDot status={title.status} />
                <span className="truncate text-[13px] font-semibold group-hover:text-[#eab308]">{title.name}</span>
              </p>
              <TitleMeta title={title} className="mt-1" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
