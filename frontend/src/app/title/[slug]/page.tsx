import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";

import { PosterArt } from "@/components/poster-card";
import { ShareButton } from "@/components/share-button";
import { TitleActions } from "@/components/title-actions";
import { NextEpisodeCountdown, TitleEpisodePanel, TitleScores } from "@/components/title-detail";
import { getRelated, getTitle } from "@/lib/api";
import { displayTitle } from "@/lib/display-title";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";
import { absoluteUrl } from "@/lib/site-url";
import { firstEpisodeId, formatAirDate, titleTypeLabel } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Coming soon",
  AIRING: "Currently Airing",
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
  const heading = displayTitle(title, locale);
  const typeLabel = t(locale, titleTypeLabel(title.type));
  const art = title.posterUrl || title.backdropUrl;
  const firstAir = title.seasons
    ?.flatMap((season) => season.episodes)
    .map((episode) => episode.airDate)
    .filter(Boolean)
    .sort()[0];
  const release = firstAir
    ? new Date(firstAir).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : title.year
      ? String(title.year)
      : "—";
  const upcoming = title.status === "AIRING" && title.nextAirDate && new Date(title.nextAirDate).getTime() > Date.now();

  return (
    <main className="pb-16">
      <section className="relative overflow-hidden">
        <PosterArt
          name={heading}
          hue={title.hue}
          src={title.backdropUrl || title.posterUrl}
          className="pointer-events-none absolute inset-0 h-[min(42vh,340px)] w-full opacity-25"
          overlay={false}
        />
        <div className="absolute inset-0 bg-linear-to-b from-canvas/70 via-canvas to-canvas" />
        <div className="page-shell relative pt-8 pb-4 sm:pt-10">
          <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_minmax(15rem,18rem)]">
            <aside className="space-y-3">
              <PosterArt
                name={heading}
                hue={title.hue}
                src={art}
                className="aspect-2/3 w-full rounded-xl shadow-[var(--shadow-card)] ring-1 ring-line"
                overlay={false}
              />
              {playId ? (
                <Link href={`/watch/${playId}`} className="btn btn-soft btn-lg w-full">
                  <Play className="size-4 fill-current" />
                  Watch now
                </Link>
              ) : (
                <span className="btn btn-soft btn-lg w-full pointer-events-none text-muted">
                  {title.status === "UPCOMING" && title.nextAirDate
                    ? `${t(locale, "Airs")} ${formatAirDate(title.nextAirDate)}`
                    : t(locale, "Not available yet")}
                </span>
              )}
              {upcoming && title.nextAirDate ? <NextEpisodeCountdown at={title.nextAirDate} /> : null}
              <dl className="space-y-2 pt-1 text-sm">
                {[
                  ["Type", typeLabel],
                  ["Status", STATUS_LABEL[title.status] ?? title.status],
                  ["Release", release]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>

            <div className="min-w-0">
              {title.nameJa ? <p className="text-sm text-muted">{title.nameJa}</p> : null}
              <h1 className="mt-1 text-2xl font-bold tracking-tight uppercase sm:text-4xl">{heading}</h1>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {title.genres.map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/browse?genre=${genre.slug}`}
                    className="rounded-full bg-elevated px-2.5 py-1 text-xs font-medium ring-1 ring-line hover:bg-surface"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TitleActions titleId={title.id} variant="detail" />
                <span className="xl:hidden">
                  <ShareButton title={title.name} icon />
                </span>
              </div>
              <div className="mt-5 xl:hidden">
                <TitleScores score={title.score} scoreCount={title.scoreCount} likeCount={title.likeCount} />
              </div>
              {title.synopsis ? (
                <div className="mt-8">
                  <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">Synopsis</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{title.synopsis}</p>
                </div>
              ) : null}
              <TitleEpisodePanel
                seasons={title.seasons ?? []}
                type={title.type}
                related={related}
                art={title.backdropUrl || title.posterUrl}
              />
            </div>

            <aside className="hidden xl:flex xl:flex-col xl:items-end xl:gap-10">
              <ShareButton title={title.name} icon />
              <TitleScores score={title.score} scoreCount={title.scoreCount} likeCount={title.likeCount} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
