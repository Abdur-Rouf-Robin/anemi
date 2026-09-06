import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaRail } from "@/components/media-rail";
import { PosterArt } from "@/components/poster-card";
import { SeasonBrowser } from "@/components/season-browser";
import { ShareButton } from "@/components/share-button";
import { TitleActions } from "@/components/title-actions";
import { VoteWidget } from "@/components/vote-widget";
import { getRelated, getTitle } from "@/lib/api";
import { absoluteUrl } from "@/lib/site-url";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";
import { displayTitle, studioSlug } from "@/lib/display-title";
import { firstEpisodeId, formatAirDate } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  MOVIE: "Movie",
  SERIES: "Series",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "Special"
};

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Coming soon",
  AIRING: "Airing",
  COMPLETED: "Completed"
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitle(slug);
  if (!title) notFound();
  return {
    title: title.name,
    description: title.synopsis,
    openGraph: {
      title: title.name,
      description: title.synopsis,
      type: "video.tv_show",
      url: absoluteUrl(`/title/${slug}`),
      images: title.posterUrl ? [absoluteUrl(title.posterUrl)] : undefined
    }
  };
}

export default async function TitlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = await getTitle(slug);
  if (!title) notFound();
  const locale = await requestLocale();
  const related = await getRelated(slug);
  const playId = firstEpisodeId(title);
  const playSub = firstEpisodeId(title, "SUB");
  const playDub = firstEpisodeId(title, "DUB");
  const airLabel = formatAirDate(title.nextAirDate);
  const typeLabel = t(locale, TYPE_LABEL[title.type] ?? title.type);
  const heading = displayTitle(title, locale);
  const stats = [
    ["Format", typeLabel],
    ["Year", title.year ? String(title.year) : "—"],
    ["Score", title.score != null ? `★ ${title.score.toFixed(1)}` : "—"],
    ["Studio", title.studio || "—"]
  ];
  const chips = [
    STATUS_LABEL[title.status] ? t(locale, STATUS_LABEL[title.status]) : title.status,
    title.ageRating,
    title.airSeason ? title.airSeason.toLowerCase() : null,
    title.subCount ? `${title.subCount} Sub` : null,
    title.dubCount ? `${title.dubCount} Dub` : null,
    title.episodeCount ? `${title.episodeCount} ep` : null,
    title.status === "UPCOMING" && airLabel ? `${t(locale, "Airs")} ${airLabel}` : null
  ].filter(Boolean) as string[];

  return (
    <main className="space-y-10 pb-16">
      <section className="relative overflow-hidden">
        <PosterArt
          name={heading}
          hue={title.hue}
          src={title.backdropUrl || title.posterUrl}
          className="h-[min(58vh,480px)] w-full sm:h-[min(78vh,680px)]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-canvas via-canvas/80 to-canvas/15" />
        <div className="absolute inset-0 bg-linear-to-t from-canvas via-transparent to-black/30" />
        <div className="page-shell absolute inset-x-0 bottom-0 flex items-end gap-6 pb-8 sm:pb-12">
          <PosterArt
            name={heading}
            hue={title.hue}
            src={title.posterUrl || title.backdropUrl}
            className="hidden aspect-2/3 w-36 shrink-0 rounded-2xl shadow-[var(--shadow-card)] ring-1 ring-white/15 sm:block sm:w-44"
          />
          <div className="min-w-0 pb-1">
            <p className="text-xs tracking-[0.18em] text-accent uppercase">{typeLabel}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-5xl">{heading}</h1>
            {title.nameJa && locale !== "jp" ? (
              <p className="mt-1 text-sm text-white/60">{title.nameJa}</p>
            ) : title.nameJa && locale === "jp" && title.name !== heading ? (
              <p className="mt-1 text-sm text-white/60">{title.name}</p>
            ) : null}
            <dl className="mt-4 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              {stats.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-semibold tracking-wider text-white/55 uppercase">{label}</dt>
                  <dd className="mt-0.5 font-medium text-white">
                    {label === "Studio" && title.studio ? (
                      <Link href={`/studio/${studioSlug(title.studio)}`} className="hover:text-accent">
                        {title.studio}
                      </Link>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/15 backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
            <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">{title.synopsis}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {title.genres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/browse?genre=${genre.slug}`}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/15"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <VoteWidget slug={title.slug} score={title.score} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {playSub && playDub ? (
                <>
                  <Link
                    href={`/watch/${playSub}`}
                    className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_10px_30px_color-mix(in_oklch,var(--color-accent)_40%,transparent)]"
                  >
                    Watch Sub
                  </Link>
                  <Link
                    href={`/watch/${playDub}`}
                    className="rounded-full bg-white/12 px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15"
                  >
                    Watch Dub
                  </Link>
                </>
              ) : playId ? (
                <Link
                  href={`/watch/${playId}`}
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_10px_30px_color-mix(in_oklch,var(--color-accent)_40%,transparent)]"
                >
                  {t(locale, "Play")}
                  {playDub && !playSub ? " Dub" : ""}
                </Link>
              ) : (
                <span className="rounded-full bg-elevated px-6 py-2.5 text-sm text-muted ring-1 ring-white/10">
                  {airLabel ? `${t(locale, "Airs")} ${airLabel}` : t(locale, "Not available yet")}
                </span>
              )}
              {title.status === "UPCOMING" && airLabel && playId ? (
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/10">
                  {t(locale, "Airs")} {airLabel}
                </span>
              ) : null}
              <TitleActions titleId={title.id} />
              <ShareButton title={title.name} />
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell space-y-10">
        <SeasonBrowser seasons={title.seasons ?? []} type={title.type} />
        <MediaRail title="More like this" items={related} flush />
      </div>
    </main>
  );
}
