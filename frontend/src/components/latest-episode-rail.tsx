import Link from "next/link";

import type { EpisodeCard } from "@/lib/types";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";

import { PosterArt } from "./poster-card";

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
          <Link key={item.episodeId} href={`/watch/${item.episodeId}`} className="group w-[168px] shrink-0 sm:w-[188px]">
            <div className="poster-frame relative aspect-video bg-elevated transition-transform duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.03]">
              <PosterArt
                name={item.title.name}
                hue={item.title.hue}
                src={item.title.backdropUrl || item.title.posterUrl}
                className="absolute inset-0"
              />
              <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {item.audioKind === "DUB" ? "Dub" : "Sub"}
              </span>
              <span className="absolute right-2 bottom-2 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-ink">
                EP {item.number}
              </span>
            </div>
            <p className="mt-2 truncate text-sm font-medium">{item.title.name}</p>
            <p className="truncate text-xs text-muted">{item.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
