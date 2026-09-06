import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { MediaRail } from "@/components/media-rail";
import { PageIntro } from "@/components/page-intro";
import { getPlaylist } from "@/lib/api";

import { PlaylistItems } from "./items";
import { PlaylistManage } from "./manage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const list = await getPlaylist(id);
  return { title: list?.name ?? "Playlist" };
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await getPlaylist(id);
  if (!list) notFound();
  const mine = Boolean(list.mine);

  return (
    <main className="space-y-8 py-8 pb-16">
      <div className="page-shell">
        <PageIntro
          kicker="Playlist"
          title={list.name}
          blurb={`${list.itemCount} ${list.itemCount === 1 ? "title" : "titles"} — share this link with anyone on the site.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/library/playlists" className="rounded-full bg-elevated px-4 py-1.5 text-sm ring-1 ring-white/10">
                All playlists
              </Link>
              {mine ? <PlaylistManage id={list.id} name={list.name} /> : null}
            </div>
          }
        />
      </div>
      {list.items.length ? (
        mine ? <PlaylistItems playlistId={list.id} items={list.items} /> : <MediaRail title="Titles" items={list.items} />
      ) : (
        <div className="page-shell">
          <EmptyState title="Empty playlist" blurb="Add titles from a title page with the Playlist button." href="/browse" hrefLabel="Browse catalog" />
        </div>
      )}
    </main>
  );
}
