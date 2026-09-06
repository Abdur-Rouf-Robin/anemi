import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { PosterArt } from "@/components/poster-card";
import { getPlaylists } from "@/lib/api";

import { CreatePlaylist } from "./create-playlist";

export const metadata: Metadata = { title: "Playlists" };

export default async function PlaylistsPage() {
  const lists = await getPlaylists();

  if (!lists) {
    return (
      <main className="page-shell max-w-lg py-16">
        <PageIntro kicker="Lists" title="Playlists" blurb="Sign in to collect titles into your own shelves." />
        <Link href="/account" className="mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-8 py-8 pb-16">
      <PageIntro
        kicker="Lists"
        title="Playlists"
        blurb="Private collections you can share by link. Up to 20 lists, 48 titles each."
        actions={
          <Link href="/library" className="rounded-full bg-elevated px-4 py-1.5 text-sm ring-1 ring-white/10">
            Back to library
          </Link>
        }
      />
      <CreatePlaylist />
      {lists.length === 0 ? (
        <EmptyState title="No playlists yet" blurb="Create one here, or tap Playlist on a title page." href="/browse" hrefLabel="Browse catalog" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lists.map((list) => (
            <li key={list.id}>
              <Link href={`/playlist/${list.id}`} className="card-panel flex gap-3 p-3 hover:bg-elevated">
                <div className="flex -space-x-2">
                  {(list.items ?? []).slice(0, 3).map((title) => (
                    <PosterArt
                      key={title.id}
                      name={title.name}
                      hue={title.hue}
                      src={title.posterUrl}
                      className="h-16 w-12 rounded-md ring-2 ring-canvas"
                    />
                  ))}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{list.name}</span>
                  <span className="text-sm text-muted">
                    {list.itemCount} {list.itemCount === 1 ? "title" : "titles"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
