import type { Metadata } from "next";

import { GenrePills } from "@/components/genre-pills";
import { MediaRail } from "@/components/media-rail";
import { PageIntro } from "@/components/page-intro";
import { PosterGrid } from "@/components/poster-card";
import { SeasonArchive } from "@/components/season-archive";
import { getDiscover, getGenres } from "@/lib/api";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const [data, genres] = await Promise.all([getDiscover(), getGenres()]);

  return (
    <main className="space-y-10 py-8 pb-16">
      <div className="page-shell">
        <PageIntro
          kicker="Discover"
          title="Highest scores and this season"
          blurb="This season, highest rated, and recently updated — plus every genre."
        />
        <div className="mt-5">
          <GenrePills genres={genres} padded={false} />
        </div>
      </div>
      <div className="page-shell grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div className="space-y-10">
          <MediaRail
            title={data ? `This season · ${data.season.toLowerCase()}` : "This season"}
            items={data?.seasonal ?? []}
            href="/browse?status=AIRING"
            flush
          />
          <MediaRail title="Highest rated" items={data?.scored ?? []} href="/browse?sort=score" flush />
          <MediaRail title="Recently updated" items={data?.updated ?? []} href="/browse?sort=updated" flush />
        </div>
        <SeasonArchive />
      </div>
      {!data?.seasonal.length && !data?.scored.length && (data?.updated ?? []).length ? (
        <div className="page-shell">
          <PosterGrid items={data?.updated ?? []} />
        </div>
      ) : null}
    </main>
  );
}
