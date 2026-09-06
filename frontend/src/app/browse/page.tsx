import type { Metadata } from "next";

import { CatalogPager } from "@/components/catalog-pager";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { PageIntro } from "@/components/page-intro";
import { PosterGrid } from "@/components/poster-card";
import { TopCharts } from "@/components/top-charts";
import { getCharts, getGenres, getTitles } from "@/lib/api";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";

const TAKE = 24;

function heading(params: {
  type?: string;
  status?: string;
  audio?: string;
  genre?: string;
  genreName?: string;
  studioName?: string;
}) {
  if (params.status === "UPCOMING") {
    return { title: "Coming soon", blurb: "Titles with a published air date. Dates show on the poster." };
  }
  if (params.type === "MOVIE") return { title: "Movies", blurb: "Feature-length titles in the catalog." };
  if (params.type === "SERIES") return { title: "Series", blurb: "Seasonal shows, episode by episode." };
  if (params.type === "ANIMATION") return { title: "Animation", blurb: "OVA, ONA, and specials." };
  if (params.type === "OVA") return { title: "OVAs", blurb: "Original video titles." };
  if (params.type === "ONA") return { title: "ONAs", blurb: "Original net titles." };
  if (params.type === "SPECIAL") return { title: "Specials", blurb: "One-off episodes and recaps." };
  if (params.audio === "SUB") return { title: "Subbed", blurb: "Episodes with a subtitle track." };
  if (params.audio === "DUB") return { title: "Dubbed", blurb: "Episodes with a dubbed audio file." };
  if (params.status === "AIRING") return { title: "Airing now", blurb: "Currently publishing." };
  if (params.status === "COMPLETED") return { title: "Completed", blurb: "Finished titles." };
  if (params.genreName) return { title: params.genreName, blurb: "Filtered by genre." };
  if (params.studioName) return { title: params.studioName, blurb: "Titles from this studio." };
  return { title: "Browse", blurb: "Filter by type, status, audio, season, or genre." };
}

export const metadata: Metadata = { title: "Browse" };

export default async function BrowsePage({
  searchParams
}: {
  searchParams: Promise<{
    type?: string;
    sort?: string;
    genre?: string;
    status?: string;
    year?: string;
    season?: string;
    audio?: string;
    studio?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const skip = String((page - 1) * TAKE);
  const [catalog, genres, charts] = await Promise.all([
    getTitles({
      type: params.type,
      sort: params.sort,
      genre: params.genre,
      status: params.status,
      year: params.year,
      season: params.season,
      audio: params.audio,
      studio: params.studio,
      take: String(TAKE),
      skip
    }),
    getGenres(),
    getCharts()
  ]);
  const locale = await requestLocale();
  const copy = heading({
    ...params,
    genreName: genres.find((genre) => genre.slug === params.genre)?.name,
    studioName: params.studio
  });

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") query.set(key, value);
    }
    if (nextPage > 1) query.set("page", String(nextPage));
    const qs = query.toString();
    return qs ? `/browse?${qs}` : "/browse";
  }

  return (
    <main className="page-shell py-8 pb-16">
      <PageIntro kicker="Catalog" title={t(locale, copy.title)} blurb={t(locale, copy.blurb)} />
      <div className="card-panel mt-6 p-4 sm:p-5">
        <FilterChips path="/browse" {...params} genres={genres} />
      </div>
      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div>
          <p className="mb-4 text-sm text-muted">
            {catalog.total} title{catalog.total === 1 ? "" : "s"}
          </p>
          <PosterGrid items={catalog.items} />
          {catalog.items.length === 0 ? (
            <EmptyState
              title="Nothing matches these filters"
              blurb="Clear a chip or open the full catalog."
              href="/browse"
              hrefLabel="Clear filters"
            />
          ) : (
            <CatalogPager page={page} total={catalog.total} take={TAKE} hrefFor={hrefFor} />
          )}
        </div>
        <TopCharts charts={charts} />
      </div>
    </main>
  );
}
