import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { PageIntro } from "@/components/page-intro";
import { PosterGrid } from "@/components/poster-card";
import { SearchBox } from "@/components/search-box";
import { getGenres, getTitles } from "@/lib/api";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    genre?: string;
    status?: string;
    year?: string;
    season?: string;
    audio?: string;
  }>;
}) {
  const params = await searchParams;
  const [catalog, genres] = await Promise.all([
    params.q
      ? getTitles({
          ...params,
          sort: params.sort || "relevance",
          take: "48"
        })
      : Promise.resolve({ items: [], total: 0 }),
    getGenres()
  ]);

  return (
    <main className="page-shell py-8 pb-16">
      <PageIntro kicker="Find" title="Search" blurb="Look up a title, then narrow by type, audio, or genre." />
      <div className="mt-5 max-w-xl">
        <Suspense>
          <SearchBox autoFocus />
        </Suspense>
      </div>
      {params.q ? (
        <>
          <div className="card-panel mt-5 p-4 sm:p-5">
            <FilterChips
              path="/search"
              q={params.q}
              type={params.type}
              sort={params.sort}
              genre={params.genre}
              status={params.status}
              year={params.year}
              season={params.season}
              audio={params.audio}
              genres={genres}
            />
          </div>
          <p className="mt-5 text-sm text-muted">
            {catalog.total} result{catalog.total === 1 ? "" : "s"} for “{params.q}”
          </p>
          <div className="mt-4">
            <PosterGrid items={catalog.items} />
          </div>
          {catalog.items.length === 0 ? (
            <EmptyState
              title="No titles match"
              blurb="Try another word, or browse the catalog."
              href="/browse"
              hrefLabel="Browse"
            />
          ) : null}
        </>
      ) : (
        <p className="mt-10 text-sm text-muted">Type a title. Filters show after you search.</p>
      )}
    </main>
  );
}
