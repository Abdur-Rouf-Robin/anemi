import { AiringSoonRail } from "@/components/airing-soon-rail";
import { AzStrip } from "@/components/az-strip";
import { CommunityRail } from "@/components/community-rail";
import { FeaturedProgramme } from "@/components/featured-programme";
import { GenreShowcase } from "@/components/genre-showcase";
import { HeroCarousel } from "@/components/hero-carousel";
import { HomeContinue } from "@/components/home-continue";
import { LatestReleaseGrid } from "@/components/latest-release-grid";
import { MediaRail } from "@/components/media-rail";
import { PopularNow } from "@/components/popular-now";
import { WatchNextRail } from "@/components/watch-next-rail";
import { WeekSchedule } from "@/components/week-schedule";
import { getCommunityPosts, getGenres, getHomeState, getLatest, getLibrary, getRelated, getSchedule } from "@/lib/api";
import { DEFAULT_HOME_SECTIONS } from "@/lib/home-config";
import { uniqueById } from "@/lib/utils";

export default async function HomePage() {
  const [{ home, live: catalogLive }, library, latest, genres, schedule, posts] = await Promise.all([
    getHomeState(),
    getLibrary(),
    getLatest(),
    getGenres(),
    getSchedule(),
    getCommunityPosts(undefined, 5)
  ]);
  const show = { ...DEFAULT_HOME_SECTIONS, ...home.homeSections };
  const continueItems = uniqueById(library?.continueWatching ?? []);
  const heroes = uniqueById(home.spotlights?.length ? home.spotlights : home.spotlight ? [home.spotlight] : []);
  const films = uniqueById(home.movies);
  const seed = home.watchNextTitle ?? continueItems[0] ?? home.trending[0] ?? heroes[0];
  const related = show.watchNext && seed?.slug ? await getRelated(seed.slug) : [];
  const charts = home.charts;
  const genreTabs = home.featuredGenres?.length ? home.featuredGenres : genres.slice(0, 6);

  return (
    <main className="pb-20">
      {show.hero ? <HeroCarousel items={heroes} /> : null}
      <div className={`relative z-10 space-y-10${show.continueWatching && continueItems.length ? " -mt-6 sm:-mt-10" : " pt-4"}`}>
      {show.continueWatching && continueItems.length ? <HomeContinue items={continueItems} /> : null}

      {show.schedule && (schedule?.days ?? []).length ? <WeekSchedule days={schedule?.days ?? []} compact /> : null}

      {show.featuredFilm && films.length ? <FeaturedProgramme items={films} /> : null}

      <div className="page-shell grid items-start gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,22rem)]">
        {show.latest ? <LatestReleaseGrid items={latest?.items ?? []} flush /> : <div />}
        {show.popular ? <PopularNow charts={charts} trending={uniqueById(home.trending)} flush /> : null}
      </div>

      {show.airingSoon ? <AiringSoonRail items={uniqueById(home.upcoming ?? [])} /> : null}
      {show.genres ? <GenreShowcase genres={genreTabs} /> : null}
      {show.watchNext ? <WatchNextRail items={related} studio={seed?.studio} name={seed?.name} /> : null}
      {show.following ? <MediaRail title="Following" items={uniqueById(library?.following ?? [])} href="/library" /> : null}
      {show.airingNow ? <MediaRail title="Airing now" items={uniqueById(home.airing ?? [])} href="/browse?status=AIRING" /> : null}
      {show.newlyAdded ? <MediaRail title="Newly added" items={uniqueById(home.added ?? [])} href="/browse?sort=newest" /> : null}
      {show.series ? <MediaRail title="Series" items={uniqueById(home.series ?? [])} href="/browse?type=SERIES" /> : null}
      {show.comingSoon ? (
        <MediaRail title="Coming soon" items={uniqueById(home.upcoming ?? [])} href="/browse?status=UPCOMING" showAirDate />
      ) : null}
      {show.collections
        ? (home.collections ?? []).map((shelf) => (
            <MediaRail
              key={shelf.slug}
              title={shelf.name}
              items={uniqueById(shelf.items)}
              href={`/collection/${shelf.slug}`}
            />
          ))
        : null}
      {show.community ? <CommunityRail posts={posts} /> : null}
      {show.az ? <AzStrip /> : null}

      {!catalogLive ? (
        <p className="page-shell text-sm text-muted">
          The catalog is unavailable right now. Try again in a minute.
        </p>
      ) : !heroes.length && !home.trending.length && !home.movies.length ? (
        <p className="page-shell text-sm text-muted">
          Nothing published yet. Sign in as staff and add a title you own or license in the CMS.
        </p>
      ) : null}
      </div>
    </main>
  );
}
