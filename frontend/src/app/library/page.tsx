import type { Metadata } from "next";
import Link from "next/link";

import { LibraryTools } from "./tools";
import { EmptyState } from "@/components/empty-state";
import { MediaRail } from "@/components/media-rail";
import { PageIntro } from "@/components/page-intro";
import { PosterArt } from "@/components/poster-card";
import { getLibrary } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

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
        <PageIntro kicker="Lists" title="Library" blurb="Continue, lists, follows, and AniList import." />
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
        <h2 className="text-xl font-semibold tracking-tight">History</h2>
        <ul className="card-panel mt-4 divide-y divide-line overflow-hidden">
          {library.history.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">Nothing watched yet.</li>
          ) : (
            library.history.map((row) => (
              <li key={`${row.episodeId}-${row.watchedAt}`}>
                <Link href={`/watch/${row.episodeId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-elevated">
                  <PosterArt
                    name={row.title.name}
                    hue={row.title.hue}
                    src={row.title.posterUrl}
                    className="h-14 w-10 shrink-0 rounded-md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{row.title.name}</span>
                    <span className="text-sm text-muted">{row.episodeName}</span>
                  </span>
                  {row.watchedAt ? (
                    <span className="shrink-0 text-xs text-muted">{formatRelativeTime(row.watchedAt)}</span>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
