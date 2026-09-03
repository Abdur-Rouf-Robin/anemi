export const DEFAULT_HOME_SECTIONS = {
  hero: true,
  schedule: true,
  featuredFilm: true,
  popular: true,
  latest: true,
  airingSoon: true,
  genres: true,
  watchNext: true,
  continueWatching: true,
  following: true,
  airingNow: true,
  newlyAdded: true,
  series: true,
  comingSoon: true,
  az: true
} as const;

export type HomeSectionKey = keyof typeof DEFAULT_HOME_SECTIONS;

export type HomeConfig = {
  spotlightIds: string[];
  featuredIds: string[];
  genreSlugs: string[];
  watchNextTitleId: string | null;
  sections: Record<HomeSectionKey, boolean>;
};

export const HOME_SECTION_META: { key: HomeSectionKey; label: string; hint: string }[] = [
  { key: "hero", label: "Hero spotlight", hint: "Big carousel at the top of home" },
  { key: "continueWatching", label: "Continue watching", hint: "Signed-in progress rail" },
  { key: "schedule", label: "Estimated schedule", hint: "Week strip from episode air dates" },
  { key: "featuredFilm", label: "Featured films", hint: "Poster + watch/watchlist programme queue" },
  { key: "popular", label: "Popular now", hint: "Top five and 7-day charts" },
  { key: "latest", label: "Latest releases", hint: "Newest episodes grid" },
  { key: "airingSoon", label: "Airing soon", hint: "Upcoming titles with air times" },
  { key: "genres", label: "Browse by genre", hint: "Genre tabs on home" },
  { key: "watchNext", label: "Watch next", hint: "Similar-genre / same-studio rail" },
  { key: "following", label: "Following", hint: "Titles the viewer follows" },
  { key: "airingNow", label: "Airing now", hint: "Status = Airing" },
  { key: "newlyAdded", label: "Newly added", hint: "Recently created titles" },
  { key: "series", label: "Series rail", hint: "TV series row" },
  { key: "comingSoon", label: "Coming soon", hint: "Status = Upcoming" },
  { key: "az", label: "A–Z strip", hint: "Letter index on home" }
];

export function emptyHomeConfig(): HomeConfig {
  return {
    spotlightIds: [],
    featuredIds: [],
    genreSlugs: [],
    watchNextTitleId: null,
    sections: { ...DEFAULT_HOME_SECTIONS }
  };
}

export function normalizeHomeConfig(raw: unknown): HomeConfig {
  const base = emptyHomeConfig();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<HomeConfig>;
  const sections: Record<HomeSectionKey, boolean> = { ...DEFAULT_HOME_SECTIONS };
  if (value.sections && typeof value.sections === "object") {
    for (const key of Object.keys(DEFAULT_HOME_SECTIONS) as HomeSectionKey[]) {
      if (typeof value.sections[key] === "boolean") sections[key] = value.sections[key];
    }
  }
  return {
    spotlightIds: Array.isArray(value.spotlightIds) ? value.spotlightIds.filter((id) => typeof id === "string").slice(0, 8) : [],
    featuredIds: Array.isArray(value.featuredIds) ? value.featuredIds.filter((id) => typeof id === "string").slice(0, 8) : [],
    genreSlugs: Array.isArray(value.genreSlugs) ? value.genreSlugs.filter((id) => typeof id === "string").slice(0, 8) : [],
    watchNextTitleId: typeof value.watchNextTitleId === "string" && value.watchNextTitleId ? value.watchNextTitleId : null,
    sections
  };
}
