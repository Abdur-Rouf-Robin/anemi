import Link from "next/link";

import type { TitleCard } from "@/lib/types";
import { firstEpisodeId } from "@/lib/utils";

import { PosterArt } from "./poster-card";
import { SectionHead } from "./section-head";

export function WatchNextRail({
  items,
  studio,
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
          const sameStudio = Boolean(studio && title.studio && title.studio === studio);
          return (
            <Link
              key={title.id}
              href={playId ? `/watch/${playId}` : `/title/${title.slug}`}
              className="w-[160px] shrink-0 sm:w-[176px]"
            >
              <div className="poster-frame relative aspect-2/3">
                <PosterArt name={title.name} hue={title.hue} src={title.posterUrl} className="absolute inset-0" />
                <span className="absolute top-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  {sameStudio ? "Same studio" : "Similar genre"}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold">{title.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {[title.studio, title.score != null ? `★ ${title.score.toFixed(1)}` : null].filter(Boolean).join(" · ")}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
