const KEY = "anemi-recent-searches";

export function readRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((row): row is string => typeof row === "string" && row.trim().length > 0).slice(0, 8);
  } catch {
    return [];
  }
}

export function rememberSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  const next = [q, ...readRecentSearches().filter((row) => row.toLowerCase() !== q.toLowerCase())].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function forgetSearch(query: string) {
  localStorage.setItem(
    KEY,
    JSON.stringify(readRecentSearches().filter((row) => row.toLowerCase() !== query.trim().toLowerCase()))
  );
}
