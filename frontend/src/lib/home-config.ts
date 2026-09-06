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
  { key: "collections", label: "Staff collections", hint: "Editor shelves such as Start here" },
  { key: "community", label: "Community rail", hint: "Latest board posts on home" },
  { key: "az", label: "A–Z strip", hint: "Letter index on home" }
];

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
  const value = raw as Partial<HomeConfig>;
  const sections: Record<HomeSectionKey, boolean> = { ...DEFAULT_HOME_SECTIONS };
  if (value.sections && typeof value.sections === "object") {
    for (const key of Object.keys(DEFAULT_HOME_SECTIONS) as HomeSectionKey[]) {
      if (typeof value.sections[key] === "boolean") sections[key] = value.sections[key];
    }
  }
  const used = new Set<string>();
  const collections: HomeCollection[] = [];
  if (Array.isArray(value.collections)) {
    for (const row of value.collections) {
      if (!row || typeof row !== "object") continue;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!name) continue;
      const id = typeof row.id === "string" && row.id ? row.id : `col-${collections.length + 1}`;
      let slug = slugify(typeof row.slug === "string" ? row.slug : name, `shelf-${id.slice(-4)}`);
      if (used.has(slug)) slug = `${slug}-${id.slice(-4)}`;
      used.add(slug);
      collections.push({
        id,
        name,
        slug,
        titleIds: Array.isArray(row.titleIds) ? row.titleIds.filter((titleId) => typeof titleId === "string").slice(0, 24) : []
      });
      if (collections.length >= 8) break;
    }
  }
  return {
    spotlightIds: Array.isArray(value.spotlightIds) ? value.spotlightIds.filter((id) => typeof id === "string").slice(0, 8) : [],
    featuredIds: Array.isArray(value.featuredIds) ? value.featuredIds.filter((id) => typeof id === "string").slice(0, 8) : [],
    genreSlugs: Array.isArray(value.genreSlugs) ? value.genreSlugs.filter((id) => typeof id === "string").slice(0, 8) : [],
    watchNextTitleId: typeof value.watchNextTitleId === "string" && value.watchNextTitleId ? value.watchNextTitleId : null,
    collections,
    sections
  };
}
