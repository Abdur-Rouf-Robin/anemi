import type { Locale } from "./i18n";

export function displayTitle(
  title: { name: string; nameJa?: string | null },
  locale?: Locale | string,
  titleLanguage?: "english" | "romaji"
) {
  if (titleLanguage === "romaji") return title.name;
  if (locale === "jp" && title.nameJa?.trim()) return title.nameJa.trim();
  return title.name;
}

export function studioSlug(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
  return slug || "studio";
}

export function episodeKindLabel(kind?: string | null) {
  if (kind === "FILLER") return "Filler";
  if (kind === "RECAP") return "Recap";
  return null;
}
