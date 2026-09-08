import type { Metadata } from "next";

import { BrowseSort } from "@/components/browse-sort";
import { CatalogPager } from "@/components/catalog-pager";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { FilterToggle } from "@/components/filter-toggle";
import { PageHeader } from "@/components/page-header";
import { PosterGrid } from "@/components/poster-card";
import { getGenres, getTitles } from "@/lib/api";
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
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const skip = String((page - 1) * TAKE);
  const [catalog, genres] = await Promise.all([
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
    getGenres()
  ]);
  const locale = await requestLocale();
  const filtered = Boolean(params.type || params.genre || params.status || params.year || params.season || params.audio || params.studio);

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
      <PageHeader title={t(locale, "Series")} blurb={t(locale, "Browse our collection of series")} uppercase />
      <div className="page-rule" />
      <FilterToggle defaultOpen={filtered}>
        <FilterChips path="/browse" {...params} genres={genres} />
      </FilterToggle>
      <BrowseSort value={params.sort ?? "popular"} params={params} />
      <PosterGrid items={catalog.items} />
      {catalog.items.length === 0 ? (
        <EmptyState
          title="No anime found"
          blurb="Try a different sorting option or clear filters."
          href="/browse"
          hrefLabel="Clear filters"
        />
      ) : (
        <CatalogPager page={page} total={catalog.total} take={TAKE} hrefFor={(next) => hrefFor(next)} />
      )}
    </main>
  );
}
