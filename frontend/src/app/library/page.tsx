import type { Metadata } from "next";
import Link from "next/link";

import { ClearHistory } from "./clear-history";
import { HistoryRow } from "./history-row";
import { LibraryTools } from "./tools";
import { EmptyState } from "@/components/empty-state";
import { MediaRail } from "@/components/media-rail";
import { PageIntro } from "@/components/page-intro";
import { getLibrary } from "@/lib/api";

const LIST_LABELS = [
  { key: "WATCHING", label: "Watching" },
  { key: "PLAN_TO_WATCH", label: "Plan to watch" },
  { key: "ON_HOLD", label: "On hold" },
  { key: "DROPPED", label: "Dropped" },
  { key: "COMPLETED", label: "Completed" }
] as const;

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const library = await getLibrary();

  if (!library) {
    return (
      <main className="page-shell max-w-lg py-16">
        <PageIntro kicker="Lists" title="Library" blurb="Sign in to keep lists, history, and follows." />
        <Link href="/account" className="mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
          Sign in
        </Link>
      </main>
    );
  }

  const empty =
    !library.continueWatching.length &&
    !library.later.length &&
    !library.following.length &&
    !library.history.length &&
    LIST_LABELS.every((item) => !(library.lists?.[item.key] ?? []).length);

  return (
    <main className="space-y-10 py-8 pb-16">
      <div className="page-shell flex flex-wrap items-end justify-between gap-3">
        <PageIntro
          kicker="Lists"
          title="Library"
          blurb="Continue, lists, follows, playlists, and AniList import."
          actions={
            <Link href="/library/playlists" className="rounded-full bg-elevated px-4 py-1.5 text-sm ring-1 ring-white/10">
              Playlists
            </Link>
          }
        />
        <LibraryTools />
      </div>
      {empty ? (
        <div className="page-shell">
          <EmptyState
            title="Nothing saved yet"
            blurb="Play an episode or add a title to a list from its page."
            href="/browse"
            hrefLabel="Browse catalog"
          />
        </div>
      ) : null}
      <MediaRail title="Continue watching" items={library.continueWatching} />
      <MediaRail title="Watch later" items={library.later} />
      <MediaRail title="Following" items={library.following} />
      {LIST_LABELS.map((item) => (
        <MediaRail key={item.key} title={item.label} items={library.lists?.[item.key] ?? []} />
      ))}
      <section className="page-shell">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">History</h2>
          {library.history.length ? <ClearHistory /> : null}
        </div>
        <ul className="card-panel mt-4 divide-y divide-line overflow-hidden">
          {library.history.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">Nothing watched yet.</li>
          ) : (
            library.history.map((row) => (
              <HistoryRow
                key={`${row.episodeId}-${row.watchedAt}`}
                episodeId={row.episodeId}
                episodeName={row.episodeName}
                watchedAt={row.watchedAt}
                title={row.title}
              />
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
