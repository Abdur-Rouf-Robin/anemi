import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { LatestReleaseGrid } from "@/components/latest-release-grid";
import { PageIntro } from "@/components/page-intro";
import { getLatest } from "@/lib/api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Latest" };

export default async function LatestPage({
  searchParams
}: {
  searchParams: Promise<{ audio?: string }>;
}) {
  const { audio } = await searchParams;
  const data = await getLatest(audio, 48);

  return (
    <main className="py-8 pb-16">
      <div className="page-shell">
        <PageIntro
          kicker="Release desk"
          title="Latest episodes"
          blurb="Newest published episodes from titles you host — Sub, Dub, or both."
          actions={
            <div className="flex gap-2">
              {[
                { value: "", label: "All" },
                { value: "SUB", label: "Sub" },
                { value: "DUB", label: "Dub" }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.value ? `/latest?audio=${item.value}` : "/latest"}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10",
                    (audio ?? "") === item.value ? "chip-on" : "bg-elevated text-muted hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          }
        />
      </div>
      <div className="mt-8">
        {(data?.items ?? []).length ? (
          <LatestReleaseGrid items={data?.items ?? []} headed={false} />
        ) : (
          <div className="page-shell">
            <EmptyState
              title="No episodes yet"
              blurb="Publish a title and upload episode files in the CMS."
              href="/browse"
              hrefLabel="Browse catalog"
            />
          </div>
        )}
      </div>
    </main>
  );
}
