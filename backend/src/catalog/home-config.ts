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
      if (typeof (value.sections as Record<string, unknown>)[key] === "boolean") {
        sections[key] = Boolean((value.sections as Record<string, unknown>)[key]);
      }
    }
  }
  return {
    spotlightIds: Array.isArray(value.spotlightIds)
      ? value.spotlightIds.filter((id): id is string => typeof id === "string").slice(0, 8)
      : [],
    featuredIds: Array.isArray(value.featuredIds)
      ? value.featuredIds.filter((id): id is string => typeof id === "string").slice(0, 8)
      : [],
    genreSlugs: Array.isArray(value.genreSlugs)
      ? value.genreSlugs.filter((id): id is string => typeof id === "string").slice(0, 8)
      : [],
    watchNextTitleId:
      typeof value.watchNextTitleId === "string" && value.watchNextTitleId ? value.watchNextTitleId : null,
    sections
  };
}
