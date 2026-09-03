import type { Preferences } from "./types";

export const defaultPrefs: Preferences = {
  autoPlay: true,
  autoNext: true,
  autoSkipIntro: true,
  theme: "dark",
  locale: "en"
};

const KEY = "anemi-prefs";

export function readLocalPrefs(): Preferences {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Preferences>) : {};
    const theme = parsed.theme ?? (localStorage.getItem("anemi-theme") === "light" ? "light" : "dark");
    const locale = parsed.locale === "jp" || cookieLocale() === "jp" ? "jp" : "en";
    return { ...defaultPrefs, ...parsed, theme, locale };
  } catch {
    return defaultPrefs;
  }
}

export function writeLocalPrefs(prefs: Preferences) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  localStorage.setItem("anemi-theme", prefs.theme);
  document.cookie = `anemi_locale=${prefs.locale};path=/;max-age=31536000;samesite=lax`;
  window.dispatchEvent(new Event("anemi-locale"));
  window.dispatchEvent(new Event("anemi-prefs"));
}

export function cookieLocale() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )anemi_locale=([^;]*)/);
  return match?.[1] === "jp" ? "jp" : "en";
}
