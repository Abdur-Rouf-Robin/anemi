import type { Metadata } from "next";

import { AzStrip } from "@/components/az-strip";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { WeekSchedule } from "@/components/week-schedule";
import { getSchedule } from "@/lib/api";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const data = await getSchedule();
  const days = data?.days ?? [];

  return (
    <main className="space-y-10 py-8 pb-16">
      <div className="page-shell">
        <PageIntro
          kicker="Calendar"
          title="Schedule"
          blurb="Upcoming and recent air dates from your catalog, in your local timezone."
        />
      </div>
      {days.length ? (
        <WeekSchedule days={days} />
      ) : (
        <div className="page-shell">
          <EmptyState
            title="No dated episodes"
            blurb="Set air times on episodes in the CMS to fill this week."
            href="/browse"
            hrefLabel="Browse catalog"
          />
        </div>
      )}
      <AzStrip />
    </main>
  );
}
