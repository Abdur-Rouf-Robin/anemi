import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PosterArt, PosterGrid } from "@/components/poster-card";
import { SegmentedLinks } from "@/components/segmented-links";
import { getCharts, getDiscover, getHomeState, getPlaylists, getTitles } from "@/lib/api";
import type { TitleCard } from "@/lib/types";

export const metadata: Metadata = { title: "Discover" };

const TABS = [
  { id: "popular", label: "Popular" },
  { id: "trending", label: "Trending" },
  { id: "top-rated", label: "Top Rated" },
  { id: "lists", label: "Lists" }
] as const;

const RANGES = [
  { id: "month", label: "This Month" },
  { id: "week", label: "This Week" },
  { id: "day", label: "Today" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" }
] as const;

function copy(tab: string, range: string) {
  if (tab === "trending") {
    return { title: "Trending", blurb: "Based on momentum over last 48 hours" };
  }
  if (tab === "top-rated") {
    return { title: "Top Rated", blurb: "Weighted by rating count" };
  }
  if (tab === "lists") {
    return { title: "Lists", blurb: "Community favorites" };
  }
  const rangeLabel = RANGES.find((item) => item.id === range)?.label ?? "This Month";
  return { title: "Popular", blurb: `Most viewed anime • ${rangeLabel}` };
}

export default async function DiscoverPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const params = await searchParams;
  const tab = TABS.some((item) => item.id === params.tab) ? params.tab! : "popular";
  const range = RANGES.some((item) => item.id === params.range) ? params.range! : "month";
  const [discover, charts, homeState, playlists, allTime] = await Promise.all([
    getDiscover(),
    getCharts(),
    getHomeState(),
    getPlaylists(),
    tab === "popular" && (range === "year" || range === "all")
      ? getTitles({ sort: "popular", take: "48" })
      : Promise.resolve(null)
  ]);

  let items: TitleCard[] = [];
  if (tab === "trending") items = charts?.day?.length ? charts.day : (discover?.updated ?? []);
  else if (tab === "top-rated") items = discover?.scored ?? [];
  else if (tab === "popular") {
    if (range === "day") items = charts?.day ?? [];
    else if (range === "week") items = charts?.week ?? [];
    else if (range === "month") items = charts?.month ?? [];
    else items = allTime?.items ?? [];
  }

  const collections = homeState.home.collections ?? [];
  const heading = copy(tab, range);

  return (
    <main className="page-shell py-8 pb-16 xl:py-10">
      <PageHeader title="Discover" blurb="Find your next favorite anime" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SegmentedLinks
          items={TABS.map((item) => ({
            href: item.id === "popular" ? `/discover?tab=${item.id}&range=${range}` : `/discover?tab=${item.id}`,
            label: item.label,
            active: tab === item.id
          }))}
        />
        {tab === "popular" ? (
          <SegmentedLinks
            items={RANGES.map((item) => ({
              href: `/discover?tab=popular&range=${item.id}`,
              label: item.label,
              active: range === item.id
            }))}
          />
        ) : null}
      </div>
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{heading.title}</h2>
        <p className="text-sm text-muted">{heading.blurb}</p>
      </div>

      {tab === "lists" ? (
        collections.length || (playlists ?? []).length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((shelf) => (
              <li key={shelf.slug}>
                <Link href={`/collection/${shelf.slug}`} className="card-panel flex gap-3 p-3 hover:bg-elevated">
                  <div className="flex -space-x-2">
                    {shelf.items.slice(0, 3).map((title) => (
                      <PosterArt
                        key={title.id}
                        name={title.name}
                        hue={title.hue}
                        src={title.posterUrl}
                        className="h-16 w-12 rounded-md ring-2 ring-canvas"
                      />
                    ))}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{shelf.name}</span>
                    <span className="text-sm text-muted">
                      {shelf.items.length} {shelf.items.length === 1 ? "title" : "titles"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {(playlists ?? []).map((list) => (
              <li key={list.id}>
                <Link href={`/playlist/${list.id}`} className="card-panel flex gap-3 p-3 hover:bg-elevated">
                  <div className="flex -space-x-2">
                    {(list.items ?? []).slice(0, 3).map((title) => (
                      <PosterArt
                        key={title.id}
                        name={title.name}
                        hue={title.hue}
                        src={title.posterUrl}
                        className="h-16 w-12 rounded-md ring-2 ring-canvas"
                      />
                    ))}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{list.name}</span>
                    <span className="text-sm text-muted">
                      {list.itemCount} {list.itemCount === 1 ? "title" : "titles"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No lists found" blurb="Public lists and site collections will show up here." href="/browse" hrefLabel="Browse series" />
        )
      ) : items.length ? (
        <PosterGrid items={items} />
      ) : (
        <EmptyState
          title="No anime found"
          blurb="Try a different sorting option"
          href="/discover"
          hrefLabel="Reset Discover"
        />
      )}
    </main>
  );
}
