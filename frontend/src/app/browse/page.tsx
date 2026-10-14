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

function browseCopy(params: { type?: string; status?: string; sort?: string }) {
  if (params.type === "MOVIE") return { title: "Movies", blurb: "Films in this catalog" };
  if (params.type === "SERIES") return { title: "TV Series", blurb: "TV series in this catalog" };
  if (params.type === "OVA") return { title: "OVAs", blurb: "Original video animations in this catalog." };
  if (params.type === "ONA") return { title: "ONAs", blurb: "Original net animations in this catalog." };
  if (params.type === "SPECIAL") return { title: "Specials", blurb: "Specials in this catalog." };
  if (params.status === "UPCOMING") return { title: "Top Upcoming", blurb: "Titles that have not aired yet." };
  if (params.status === "AIRING") return { title: "Ongoing", blurb: "Currently publishing." };
  if (params.status === "COMPLETED") return { title: "Completed", blurb: "Finished titles." };
  if (params.sort === "score") return { title: "Highest rated", blurb: "Sorted by rating." };
  if (params.sort === "updated") return { title: "Recently updated", blurb: "Titles updated most recently." };
  if (params.sort === "newest" || params.sort === "created") return { title: "Newly added", blurb: "Recently added to the catalog." };
  return { title: "Series", blurb: "Browse our collection of series" };
}

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ type?: string; status?: string; sort?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  return { title: browseCopy(params).title };
}

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
      <PageHeader title={t(locale, browseCopy(params).title)} blurb={t(locale, browseCopy(params).blurb)} />
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
