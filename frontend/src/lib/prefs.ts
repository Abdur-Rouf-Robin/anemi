import type { ExtraSettings } from "./user-settings";
import { defaultExtraSettings, pickExtraSettings } from "./user-settings";
import type { Preferences } from "./types";

export const defaultPrefs: Preferences = {
  autoPlay: false,
  autoNext: true,
  autoSkipIntro: false,
  theme: "light",
  locale: "en",
  ...defaultExtraSettings
};

const KEY = "anemi-prefs";
export const LIGHT_CHROME_FLAG = "anemi-chrome-light";
export const LIGHT_CHROME_JUST = "anemi-chrome-light-just";

function asTheme(value: unknown): "dark" | "light" {
  return value === "dark" ? "dark" : "light";
}

function asLocale(value: unknown): "en" | "jp" {
  return value === "jp" ? "jp" : "en";
}

export function mergePrefs(base: Preferences, patch: Partial<Preferences> & { settings?: unknown }): Preferences {
  const extra = pickExtraSettings({
    ...base,
    ...(patch.settings && typeof patch.settings === "object" ? (patch.settings as ExtraSettings) : {}),
    ...patch
  });
  return {
    ...base,
    ...extra,
    autoPlay: extra.autoStart,
    autoNext: patch.autoNext ?? base.autoNext,
    autoSkipIntro: patch.autoSkipIntro ?? base.autoSkipIntro,
    theme: patch.theme ? asTheme(patch.theme) : base.theme,
    locale: patch.locale ? asLocale(patch.locale) : base.locale
  };
}

export function readLocalPrefs(): Preferences {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Preferences> & { settings?: unknown }) : {};
    const locale = asLocale(parsed.locale === "jp" || cookieLocale() === "jp" ? "jp" : "en");
    if (localStorage.getItem(LIGHT_CHROME_FLAG) !== "1") {
      localStorage.setItem(LIGHT_CHROME_FLAG, "1");
      sessionStorage.setItem(LIGHT_CHROME_JUST, "1");
      const migrated = mergePrefs(defaultPrefs, { ...parsed, theme: "light", locale });
      localStorage.setItem(KEY, JSON.stringify(migrated));
      localStorage.setItem("anemi-theme", "light");
      return migrated;
    }
    const theme = asTheme(parsed.theme ?? localStorage.getItem("anemi-theme"));
    return mergePrefs(defaultPrefs, { ...parsed, theme, locale });
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

export function prefsPutBody(prefs: Preferences, patch: Partial<Preferences> = {}) {
  const merged = mergePrefs(prefs, patch);
  return {
    autoPlay: merged.autoPlay,
    autoNext: merged.autoNext,
    autoSkipIntro: merged.autoSkipIntro,
    theme: merged.theme,
    locale: merged.locale,
    settings: extraPayloadFromPrefs(merged)
  };
}

function extraPayloadFromPrefs(prefs: Preferences) {
  return pickExtraSettings(prefs);
}
