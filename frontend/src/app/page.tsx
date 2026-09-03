import { AiringSoonRail } from "@/components/airing-soon-rail";
import { AzStrip } from "@/components/az-strip";
import { FeaturedProgramme } from "@/components/featured-programme";
import { GenreShowcase } from "@/components/genre-showcase";
import { HeroCarousel } from "@/components/hero-carousel";
import { LatestReleaseGrid } from "@/components/latest-release-grid";
import { MediaRail } from "@/components/media-rail";
import { PopularNow } from "@/components/popular-now";
import { SearchBox } from "@/components/search-box";
import { WatchNextRail } from "@/components/watch-next-rail";
import { WeekSchedule } from "@/components/week-schedule";
import { getGenres, getHome, getLatest, getLibrary, getRelated, getSchedule } from "@/lib/api";
import { DEFAULT_HOME_SECTIONS } from "@/lib/home-config";
import { uniqueById } from "@/lib/utils";
import { Suspense } from "react";

export default async function HomePage() {
  const [home, library, latest, genres, schedule] = await Promise.all([
    getHome(),
    getLibrary(),
    getLatest(),
    getGenres(),
    getSchedule()
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
    <main className="space-y-10 pb-20">
      <div className="page-shell pt-4 md:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>

      {show.hero ? <HeroCarousel items={heroes} /> : null}
      {show.continueWatching && continueItems.length ? (
        <MediaRail title="Continue watching" items={continueItems} href="/library" />
      ) : null}

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
      {show.az ? <AzStrip /> : null}

      {!heroes.length && !home.trending.length && !home.movies.length ? (
        <p className="page-shell text-sm text-muted">
          Nothing published yet. Sign in as staff and add a title you own or license in the CMS.
        </p>
      ) : null}
    </main>
  );
}
