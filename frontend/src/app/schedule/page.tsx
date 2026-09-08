import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WeekSchedule } from "@/components/week-schedule";
import { getSchedule } from "@/lib/api";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const data = await getSchedule();
  const days = data?.days ?? [];

  return (
    <main className="space-y-6 py-8 pb-16 xl:py-10">
      <div className="page-shell">
        <PageHeader title="Schedule" blurb="Find out what's airing this week" />
      </div>
      {days.length ? (
        <WeekSchedule days={days} variant="page" />
      ) : (
        <div className="page-shell">
          <EmptyState
            title="No anime airing"
            blurb="Set air times on episodes in the CMS to fill this week."
            href="/browse"
            hrefLabel="Browse series"
          />
        </div>
      )}
    </main>
  );
}
