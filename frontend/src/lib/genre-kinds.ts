const THEME_SLUGS = new Set([
  "school",
  "music",
  "historical",
  "psychological",
  "mecha",
  "sports",
  "military",
  "isekai",
  "harem",
  "iyashikei"
]);

const DEMO_SLUGS = new Set(["shounen", "seinen", "shoujo", "josei", "kids", "shojo"]);

export type GenreKind = "genre" | "theme" | "demographic";

export function genreKind(slug: string): GenreKind {
  if (DEMO_SLUGS.has(slug)) return "demographic";
  if (THEME_SLUGS.has(slug)) return "theme";
  return "genre";
}
