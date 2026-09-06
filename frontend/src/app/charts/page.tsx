import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { PosterGrid } from "@/components/poster-card";
import { TopCharts } from "@/components/top-charts";
import { getCharts } from "@/lib/api";

export const metadata: Metadata = { title: "Top 10" };

export default async function ChartsPage() {
  const charts = await getCharts();
  const week = charts?.week ?? [];

  return (
    <main className="page-shell space-y-8 py-8 pb-16">
      <PageIntro
        kicker="Charts"
        title="Top 10"
        blurb="Most watched titles today, this week, and this month — from views on this catalog."
      />
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        {week.length ? <PosterGrid items={week} /> : <EmptyState title="No views yet" blurb="Charts fill as people watch published episodes." href="/browse" hrefLabel="Browse catalog" />}
        <TopCharts charts={charts} />
      </div>
    </main>
  );
}
