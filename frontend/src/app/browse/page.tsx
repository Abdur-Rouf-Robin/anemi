import type { Metadata } from "next";

import { CatalogPager } from "@/components/catalog-pager";
import { EmptyState } from "@/components/empty-state";
import { FilterDrawer } from "@/components/filter-drawer";
import { PageHeader } from "@/components/page-header";
import { PosterGrid } from "@/components/poster-card";
import { getGenres, getStudios, getTitles } from "@/lib/api";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";

const TAKE = 24;

export const metadata: Metadata = { title: "Series" };

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
    include?: string;
    exclude?: string;
    match?: string;
    yearFrom?: string;
    yearTo?: string;
    minRatings?: string;
    scoreMin?: string;
    scoreMax?: string;
    hasEpisodes?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const skip = String((page - 1) * TAKE);
  const [catalog, genres, studios] = await Promise.all([
    getTitles({
      type: params.type,
      sort: params.sort,
      genre: params.genre,
      status: params.status,
      year: params.year,
      season: params.season,
      audio: params.audio,
      studio: params.studio,
      include: params.include,
      exclude: params.exclude,
      match: params.match,
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      minRatings: params.minRatings,
      scoreMin: params.scoreMin,
      scoreMax: params.scoreMax,
      hasEpisodes: params.hasEpisodes,
      take: String(TAKE),
      skip
    }),
    getGenres(),
    getStudios()
  ]);
  const locale = await requestLocale();
  const filtered = Boolean(
    params.type ||
      params.genre ||
      params.include ||
      params.exclude ||
      params.status ||
      params.year ||
      params.yearFrom ||
      params.yearTo ||
      params.season ||
      params.audio ||
      params.studio ||
      params.minRatings ||
      params.scoreMin ||
      params.scoreMax ||
      params.hasEpisodes
  );

  function hrefFor(nextPage: number, sort = params.sort) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page" && key !== "sort") query.set(key, value);
    }
    if (sort && sort !== "popular") query.set("sort", sort);
    if (nextPage > 1) query.set("page", String(nextPage));
    const qs = query.toString();
    return qs ? `/browse?${qs}` : "/browse";
  }

  return (
    <main className="page-shell py-8 pb-16 xl:py-10">
      <PageHeader
        title={t(locale, params.type === "MOVIE" ? "Movies" : params.type === "SERIES" ? "TV Series" : "Series")}
        blurb={t(
          locale,
          params.type === "MOVIE"
            ? "Films in this catalog"
            : params.type === "SERIES"
              ? "TV series in this catalog"
              : "Browse our collection of series"
        )}
        uppercase
      />
      <div className="page-rule" />
      <FilterDrawer path="/browse" params={params} genres={genres} studios={studios} />
      <PosterGrid items={catalog.items} />
      {catalog.items.length === 0 ? (
        <EmptyState
          title="No anime found"
          blurb={filtered ? "Clear a filter or try a wider score and year range." : "Try a different sorting option or clear filters."}
          href="/browse"
          hrefLabel="Clear filters"
        />
      ) : (
        <CatalogPager page={page} total={catalog.total} take={TAKE} hrefFor={(next) => hrefFor(next)} />
      )}
    </main>
  );
}
