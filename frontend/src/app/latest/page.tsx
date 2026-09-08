import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { LatestReleaseGrid } from "@/components/latest-release-grid";
import { PageHeader } from "@/components/page-header";
import { SegmentedLinks } from "@/components/segmented-links";
import { TitleLanguageToggle } from "@/components/title-language-toggle";
import { getLatest } from "@/lib/api";

export const metadata: Metadata = { title: "Latest Episodes" };

export default async function LatestPage({
  searchParams
}: {
  searchParams: Promise<{ audio?: string }>;
}) {
  const { audio } = await searchParams;
  const data = await getLatest(audio, 56);

  return (
    <main className="py-8 pb-16 xl:py-10">
      <div className="page-shell">
        <PageHeader
          title="Latest Episodes"
          blurb="Newly released episodes from all your favorite shows"
          actions={
            <>
              <SegmentedLinks
                items={[
                  { href: "/latest", label: "All", active: !audio },
                  { href: "/latest?audio=SUB", label: "Sub", active: audio === "SUB" },
                  { href: "/latest?audio=DUB", label: "Dub", active: audio === "DUB" }
                ]}
              />
              <TitleLanguageToggle />
            </>
          }
        />
      </div>
      <div className="mt-2">
        {(data?.items ?? []).length ? (
          <LatestReleaseGrid items={data?.items ?? []} headed={false} />
        ) : (
          <div className="page-shell">
            <EmptyState
              title="You've reached the end!"
              blurb="Check back later for more episodes"
              href="/browse"
              hrefLabel="Browse series"
            />
          </div>
        )}
      </div>
    </main>
  );
}
