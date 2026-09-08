import Link from "next/link";

import type { EpisodeCard } from "@/lib/types";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";

import { PosterArt, PosterHover } from "./poster-card";
import { StatusDot, TitleMeta } from "./title-meta";

export async function LatestEpisodeRail({
  items,
  heading = "Latest episodes",
  flush
}: {
  items: EpisodeCard[];
  heading?: string | null;
  flush?: boolean;
}) {
  const locale = await requestLocale();
  if (!items.length) return null;
  const shell = flush ? "" : "page-shell";
  return (
    <section className="space-y-3">
      {heading ? (
        <div className={`${shell} flex items-end justify-between`.trim()}>
          <h2 className="text-xl font-semibold tracking-tight">{t(locale, heading)}</h2>
          <Link href="/latest" className="text-sm text-muted hover:text-accent">
            {t(locale, "Show all")}
          </Link>
        </div>
      ) : null}
      <div className={`${shell} no-scrollbar flex gap-3 overflow-x-auto pb-1`.trim()}>
        {items.map((item) => (
          <Link key={item.episodeId} href={`/watch/${item.episodeId}`} className="group w-[160px] shrink-0 sm:w-[176px]">
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
            <p className="mt-1.5 flex items-center gap-1.5">
              <StatusDot status={item.title.status} />
              <span className="truncate text-[13px] font-semibold group-hover:text-[#eab308]">{item.title.name}</span>
            </p>
            <TitleMeta title={item.title} className="mt-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}
