import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PosterArt } from "@/components/poster-card";
import { SignInGate } from "@/components/sign-in-gate";
import { getPlaylists } from "@/lib/api";
import { getMeName } from "@/lib/server-session";

import { CreatePlaylist } from "./create-playlist";

export const metadata: Metadata = { title: "Lists" };

export default async function PlaylistsPage() {
  const lists = await getPlaylists();
  const name = await getMeName();

  if (!lists) {
    return <SignInGate title="Lists" blurb="Sign in to organize titles into custom collections." />;
  }

  return (
    <main className="page-shell py-8 pb-16 xl:py-10">
      <PageHeader
        title={`${name}'s Lists`}
        blurb="Organize your anime into custom collections"
        actions={<CreatePlaylist />}
      />
      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          blurb="Create your first list to organize favorites, recommendations, or any custom collection."
          href="/browse"
          hrefLabel="Browse series"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
