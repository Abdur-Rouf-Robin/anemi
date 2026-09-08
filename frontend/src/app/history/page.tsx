import type { Metadata } from "next";

import { ClearHistory } from "@/app/library/clear-history";
import { HistoryRow } from "@/app/library/history-row";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SignInGate } from "@/components/sign-in-gate";
import { getLibrary } from "@/lib/api";

export const metadata: Metadata = { title: "Watch History" };

export default async function HistoryPage() {
  const library = await getLibrary();

  if (!library) {
    return <SignInGate title="Watch History" blurb="Sign in to keep your complete viewing history." />;
  }

  return (
    <main className="page-shell py-8 pb-16 xl:py-10">
      <PageHeader
        title="Watch History"
        blurb="Your complete viewing history"
        actions={library.history.length ? <ClearHistory /> : null}
      />
      {library.history.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {library.history.map((row) => (
            <HistoryRow
              key={`${row.episodeId}-${row.watchedAt}`}
              episodeId={row.episodeId}
              episodeName={row.episodeName}
              watchedAt={row.watchedAt}
              title={row.title}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="End of watch history"
          blurb="That's your complete watch history"
          href="/browse"
          hrefLabel="Browse series"
        />
      )}
    </main>
  );
}
