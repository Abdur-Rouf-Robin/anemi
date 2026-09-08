import type { Metadata } from "next";

import { LibraryTools } from "./tools";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PosterGrid } from "@/components/poster-card";
import { SegmentedLinks } from "@/components/segmented-links";
import { SignInGate } from "@/components/sign-in-gate";
import { getLibrary } from "@/lib/api";
import { getMeName } from "@/lib/server-session";
import type { ListStatus, TitleCard } from "@/lib/types";

export const metadata: Metadata = { title: "Collection" };

const TABS: { id: "ALL" | ListStatus; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "WATCHING", label: "Watching" },
  { id: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "DROPPED", label: "Dropped" },
  { id: "COMPLETED", label: "Completed" }
];

export default async function LibraryPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const library = await getLibrary();
  const name = await getMeName();

  if (!library) {
    return <SignInGate title="Collection" blurb="Sign in to keep the titles you are collecting." />;
  }

  const lists = library.lists ?? {
    WATCHING: [],
    PLAN_TO_WATCH: [],
    ON_HOLD: [],
    DROPPED: [],
    COMPLETED: []
  };
  const all = TABS.slice(1).flatMap((tab) => lists[tab.id as ListStatus] ?? []);
  const tab = TABS.some((item) => item.id === status) ? (status as (typeof TABS)[number]["id"]) : "ALL";
  const items: TitleCard[] = tab === "ALL" ? all : (lists[tab] ?? []);
  const unique = items.filter((item, index, list) => list.findIndex((row) => row.id === item.id) === index);

  return (
    <main className="page-shell py-8 pb-16 xl:py-10">
      <PageHeader
        title={`${name}'s Collection`}
        blurb="Anime that you have collected"
        uppercase
      />
      <div className="page-rule" />
      <div className="mb-6">
        <SegmentedLinks
          items={TABS.map((item) => ({
            href: item.id === "ALL" ? "/library" : `/library?status=${item.id}`,
            label: item.label,
            active: tab === item.id
          }))}
        />
      </div>
      {unique.length ? (
        <PosterGrid items={unique} />
      ) : (
        <EmptyState
          title="No anime found"
          blurb="Add a title to a list from its page, then it will show up here."
          href="/browse"
          hrefLabel="Browse series"
        />
      )}
      <details className="mt-10">
        <summary className="cursor-pointer text-sm font-medium text-muted hover:text-ink">Import / Export</summary>
        <div className="mt-3">
          <LibraryTools />
        </div>
      </details>
    </main>
  );
}
