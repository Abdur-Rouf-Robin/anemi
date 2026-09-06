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
  collections: true,
  community: true,
  az: true
} as const;

export type HomeSectionKey = keyof typeof DEFAULT_HOME_SECTIONS;

export type HomeCollection = {
  id: string;
  name: string;
  slug: string;
  titleIds: string[];
};

export type HomeConfig = {
  spotlightIds: string[];
  featuredIds: string[];
  genreSlugs: string[];
  watchNextTitleId: string | null;
  collections: HomeCollection[];
  sections: Record<HomeSectionKey, boolean>;
};

export function emptyHomeConfig(): HomeConfig {
  return {
    spotlightIds: [],
    featuredIds: [],
    genreSlugs: [],
    watchNextTitleId: null,
    collections: [],
    sections: { ...DEFAULT_HOME_SECTIONS }
  };
}

function slugify(name: string, fallback: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

export function normalizeHomeConfig(raw: unknown): HomeConfig {
  const base = emptyHomeConfig();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<HomeConfig> & { collections?: unknown };
  const sections: Record<HomeSectionKey, boolean> = { ...DEFAULT_HOME_SECTIONS };
  if (value.sections && typeof value.sections === "object") {
    for (const key of Object.keys(DEFAULT_HOME_SECTIONS) as HomeSectionKey[]) {
      if (typeof (value.sections as Record<string, unknown>)[key] === "boolean") {
        sections[key] = Boolean((value.sections as Record<string, unknown>)[key]);
      }
    }
  }
  const used = new Set<string>();
  const collections: HomeCollection[] = [];
  if (Array.isArray(value.collections)) {
    for (const row of value.collections) {
      if (!row || typeof row !== "object") continue;
      const item = row as Partial<HomeCollection>;
      const name = typeof item.name === "string" ? item.name.trim() : "";
      if (!name) continue;
      const id = typeof item.id === "string" && item.id ? item.id : `col-${collections.length + 1}`;
      let slug = slugify(typeof item.slug === "string" ? item.slug : name, `shelf-${id.slice(-4)}`);
      if (used.has(slug)) slug = `${slug}-${id.slice(-4)}`;
      used.add(slug);
      collections.push({
        id,
        name,
        slug,
        titleIds: Array.isArray(item.titleIds)
          ? item.titleIds.filter((titleId): titleId is string => typeof titleId === "string").slice(0, 24)
          : []
      });
      if (collections.length >= 8) break;
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
    collections,
    sections
  };
}
