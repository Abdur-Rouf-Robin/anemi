import type { Metadata } from "next";

import { AzStrip } from "@/components/az-strip";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { PopularNow } from "@/components/popular-now";
import { PosterGrid } from "@/components/poster-card";
import { getCharts, getTitles } from "@/lib/api";

export const metadata: Metadata = { title: "A–Z" };

export default async function AzPage({
  searchParams
}: {
  searchParams: Promise<{ letter?: string }>;
}) {
  const { letter } = await searchParams;
  const [catalog, charts] = await Promise.all([
    getTitles({ ...(letter ? { letter } : {}), sort: "az", take: "80" }),
    getCharts()
  ]);

  return (
    <main className="space-y-8 py-8 pb-16">
      <div className="page-shell">
        <PageIntro
          kicker="Index"
          title="A–Z"
          blurb={letter ? `Titles starting with ${letter}.` : "Every published title, A to Z."}
        />
      </div>
      <AzStrip active={letter} heading={false} />
      <div className="page-shell grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div>
          <PosterGrid items={catalog.items} />
          {catalog.items.length === 0 ? (
            <EmptyState
              title={letter ? `Nothing under ${letter}` : "Catalog is empty"}
              blurb="Pick another letter, or add a published title in the CMS."
              href="/az"
              hrefLabel="All letters"
            />
          ) : null}
        </div>
        <PopularNow charts={charts} trending={charts?.week ?? []} flush />
      </div>
    </main>
  );
}
