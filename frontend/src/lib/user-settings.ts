export const COLOR_FIELDS = [
  { group: "base", key: "background", label: "Background", hint: "Main background color", css: "--color-canvas" },
  { group: "base", key: "foreground", label: "Foreground", hint: "Main text color", css: "--color-ink" },
  { group: "base", key: "card", label: "Card", hint: "Card background", css: "--color-surface" },
  { group: "base", key: "cardForeground", label: "Card Text", hint: "Card text color", css: "--color-ink" },
  { group: "base", key: "popover", label: "Popover", hint: "Popover background", css: "--color-surface" },
  { group: "base", key: "popoverForeground", label: "Popover Text", hint: "Popover text color", css: "--color-ink" },
  { group: "primary", key: "primary", label: "Primary", hint: "Primary buttons & accents", css: "--color-accent" },
  { group: "primary", key: "primaryForeground", label: "Primary Text", hint: "Text on primary", css: "--color-accent-ink" },
  { group: "primary", key: "secondary", label: "Secondary", hint: "Secondary elements", css: "--color-elevated" },
  { group: "primary", key: "secondaryForeground", label: "Secondary Text", hint: "Text on secondary", css: "--color-ink" },
  { group: "muted", key: "muted", label: "Muted", hint: "Muted backgrounds", css: "--color-elevated" },
  { group: "muted", key: "mutedForeground", label: "Muted Text", hint: "Muted text color", css: "--color-muted" },
  { group: "muted", key: "accent", label: "Accent", hint: "Accent highlights", css: "--color-accent" },
  { group: "muted", key: "accentForeground", label: "Accent Text", hint: "Text on accent", css: "--color-accent-ink" },
  { group: "ui", key: "border", label: "Border", hint: "Border color", css: "--color-line" },
  { group: "ui", key: "input", label: "Input", hint: "Input border color", css: "--color-elevated" },
  { group: "ui", key: "ring", label: "Ring", hint: "Focus ring color", css: "--color-accent" },
  { group: "ui", key: "destructive", label: "Destructive", hint: "Error/danger color", css: "--color-destructive" },
  { group: "sidebar", key: "sidebar", label: "Sidebar", hint: "Sidebar background", css: "--sidebar-bg" },
  { group: "sidebar", key: "sidebarForeground", label: "Sidebar Text", hint: "Sidebar text", css: "--sidebar-text" },
  { group: "sidebar", key: "sidebarAccent", label: "Sidebar Accent", hint: "Sidebar hover", css: "--sidebar-active" },
  { group: "sidebar", key: "sidebarBorder", label: "Sidebar Border", hint: "Sidebar border", css: "--sidebar-border" }
] as const;

export type ColorKey = (typeof COLOR_FIELDS)[number]["key"];
export type ColorGroup = (typeof COLOR_FIELDS)[number]["group"];

export const THUMBNAIL_SECTIONS = [
  "continueWatching",
  "latest",
  "popular",
  "recentlyUpdated",
  "seasonal",
  "history",
  "updates",
  "series"
] as const;

export type ThumbnailSection = (typeof THUMBNAIL_SECTIONS)[number];
export type ThumbnailKind = "frame" | "poster";
export type ThumbnailTypeMap = Record<ThumbnailSection, ThumbnailKind>;

export const CAROUSEL_SECTIONS = ["continueWatching", "latest", "popular", "recentlyUpdated", "seasonal"] as const;
export type CarouselSection = (typeof CAROUSEL_SECTIONS)[number];
export type CarouselDragMap = Record<CarouselSection, boolean>;

export const PRESET_THEMES = [
  { name: "zinc", label: "Zinc", swatch: "#71717a" },
  { name: "rose", label: "Rose", swatch: "#e11d48" },
  { name: "blue", label: "Blue", swatch: "#2563eb" },
  { name: "green", label: "Green", swatch: "#16a34a" },
  { name: "orange", label: "Orange", swatch: "#ea580c" }
] as const;

export type PresetTheme = (typeof PRESET_THEMES)[number]["name"];

const OLD_COLOR: Record<string, ColorKey> = {
  cardText: "cardForeground",
  popoverText: "popoverForeground",
  accentInk: "accentForeground",
  elevated: "secondary",
  line: "border",
  sidebarText: "sidebarForeground",
  sidebarActive: "sidebarAccent"
};

export const defaultThumbnailType: ThumbnailTypeMap = {
  continueWatching: "frame",
  latest: "frame",
  popular: "frame",
  recentlyUpdated: "frame",
  seasonal: "frame",
  history: "frame",
  updates: "frame",
  series: "frame"
};

export const defaultCarouselDrag: CarouselDragMap = {
  continueWatching: true,
  latest: true,
  popular: true,
  recentlyUpdated: true,
  seasonal: true
};

export type ExtraSettings = {
  autoSkipEnding: boolean;
  tapToPlayPause: boolean;
  doubleTapSeekBack: boolean;
  doubleTapSeekForward: boolean;
  progressiveLoading: boolean;
  showContinueWatching: boolean;
  hideCaughtUp: boolean;
  disableFloatingPlayer: boolean;
  grayscaleCompleted: boolean;
  dimCompleted: boolean;
  blurThumbnails: boolean;
  unblurWatched: boolean;
  showFillers: boolean;
  showRecaps: boolean;
  privateProfile: boolean;
  showBasicStats: boolean;
  showFavorites: boolean;
  showCompletionStats: boolean;
  showMilestones: boolean;
  showRatingDistribution: boolean;
  showActivityGraph: boolean;
  showActivityStats: boolean;
  showRecentActivity: boolean;
  showStatusDistribution: boolean;
  showScoreDistribution: boolean;
  showTypeDistribution: boolean;
  showYearDistribution: boolean;
  showSeasonDistribution: boolean;
  showTopGenres: boolean;
  showTopThemes: boolean;
  showTopDemographics: boolean;
  showTopStudios: boolean;
  useCustomColors: boolean;
  useLocalFonts: boolean;
  notifyNewEpisodes: boolean;
  notifyFollows: boolean;
  notifyCommunity: boolean;
  enablePushNotifications: boolean;
  autoStart: boolean;
  autoFullscreen: boolean;
  pauseWhenNotInFocus: boolean;
  enableSubtitles: boolean;
  mobileLandscapeOnFullscreen: boolean;
  av1CompatibilityFallback: boolean;
  forceAv1Transcode: boolean;
  autoNextDelay: number;
  watchedThreshold: number;
  skipOpeningButtonDuration: number;
  skipEndingButtonDuration: number;
  seekBackSeconds: number;
  seekForwardSeconds: number;
  chunkSizeKb: number;
  prescaleFactor: number;
  prescaleHeightLimit: number;
  maxRenderHeight: number;
  profileHue: number;
  customThemeName: string;
  colorTheme: PresetTheme | "custom";
  titleLanguage: "english" | "romaji";
  viewMode: "immersive" | "theater";
  fullscreenTarget: "player" | "document";
  defaultQuality: "auto" | "1080p" | "720p" | "480p";
  defaultAudio: "jpn" | "eng";
  streamCodec: "av1" | "hevc";
  av1TranscodeQuality: "balanced" | "high";
  profileAvatar: string;
  profileBanner: string;
  customColorsLight: Partial<Record<ColorKey, string>>;
  customColorsDark: Partial<Record<ColorKey, string>>;
  thumbnailType: ThumbnailTypeMap;
  carouselDrag: CarouselDragMap;
};

export const defaultExtraSettings: ExtraSettings = {
  autoSkipEnding: false,
  tapToPlayPause: true,
  doubleTapSeekBack: true,
  doubleTapSeekForward: true,
  progressiveLoading: true,
  showContinueWatching: true,
  hideCaughtUp: false,
  disableFloatingPlayer: false,
  grayscaleCompleted: false,
  dimCompleted: true,
  blurThumbnails: false,
  unblurWatched: true,
  showFillers: true,
  showRecaps: true,
  privateProfile: false,
  showBasicStats: true,
  showFavorites: true,
  showCompletionStats: true,
  showMilestones: true,
  showRatingDistribution: false,
  showActivityGraph: true,
  showActivityStats: true,
  showRecentActivity: false,
  showStatusDistribution: true,
  showScoreDistribution: true,
  showTypeDistribution: true,
  showYearDistribution: true,
  showSeasonDistribution: true,
  showTopGenres: true,
  showTopThemes: true,
  showTopDemographics: true,
  showTopStudios: true,
  useCustomColors: false,
  useLocalFonts: false,
  notifyNewEpisodes: true,
  notifyFollows: true,
  notifyCommunity: false,
  enablePushNotifications: false,
  autoStart: false,
  autoFullscreen: false,
  pauseWhenNotInFocus: false,
  enableSubtitles: true,
  mobileLandscapeOnFullscreen: false,
  av1CompatibilityFallback: false,
  forceAv1Transcode: false,
  autoNextDelay: 0,
  watchedThreshold: 85,
  skipOpeningButtonDuration: 5,
  skipEndingButtonDuration: 5,
  seekBackSeconds: 10,
  seekForwardSeconds: 10,
  chunkSizeKb: 128,
  prescaleFactor: 1,
  prescaleHeightLimit: 1080,
  maxRenderHeight: 1080,
  profileHue: 48,
  customThemeName: "My Custom Theme",
  colorTheme: "zinc",
  titleLanguage: "english",
  viewMode: "immersive",
  fullscreenTarget: "player",
  defaultQuality: "auto",
  defaultAudio: "jpn",
  streamCodec: "av1",
  av1TranscodeQuality: "balanced",
  profileAvatar: "",
  profileBanner: "",
  customColorsLight: {},
  customColorsDark: {},
  thumbnailType: { ...defaultThumbnailType },
  carouselDrag: { ...defaultCarouselDrag }
};

const BOOL_KEYS = (Object.keys(defaultExtraSettings) as (keyof ExtraSettings)[]).filter(
  (key) => typeof defaultExtraSettings[key] === "boolean"
) as (keyof ExtraSettings)[];

const NUM_KEYS = (Object.keys(defaultExtraSettings) as (keyof ExtraSettings)[]).filter(
  (key) => typeof defaultExtraSettings[key] === "number"
) as (keyof ExtraSettings)[];

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function migrateColorMap(raw: unknown): Partial<Record<ColorKey, string>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Partial<Record<ColorKey, string>> = {};
  for (const [from, to] of Object.entries(OLD_COLOR)) {
    const hex = src[from];
    if (typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex)) out[to] = hex.toLowerCase();
  }
  for (const field of COLOR_FIELDS) {
    const hex = src[field.key];
    if (typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex)) out[field.key] = hex.toLowerCase();
  }
  return out;
}

function pickThumbnailType(raw: unknown): ThumbnailTypeMap {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const next = { ...defaultThumbnailType };
  for (const key of THUMBNAIL_SECTIONS) {
    const value = src[key] ?? (key === "continueWatching" ? src.all : undefined);
    if (value === "frame" || value === "poster") next[key] = value;
  }
  return next;
}

function pickCarouselDrag(raw: unknown): CarouselDragMap {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const next = { ...defaultCarouselDrag };
  for (const key of CAROUSEL_SECTIONS) {
    const value = src[key] ?? src.all;
    if (typeof value === "boolean") next[key] = value;
  }
  return next;
}

function clipText(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function pickExtraSettings(value: Partial<ExtraSettings> | Record<string, unknown> | undefined): ExtraSettings {
  const src = (value ?? {}) as Record<string, unknown>;
  const next = {
    ...defaultExtraSettings,
    thumbnailType: { ...defaultThumbnailType },
    carouselDrag: { ...defaultCarouselDrag }
  };
  for (const key of BOOL_KEYS) {
    const raw = src[key];
    if (typeof raw === "boolean") (next[key] as boolean) = raw;
  }
  if (typeof src.autoStart !== "boolean" && typeof src.autoPlay === "boolean") next.autoStart = src.autoPlay;
  if (typeof src.dimCompleted !== "boolean" && typeof src.dimCompletedEpisodes === "boolean") {
    next.dimCompleted = src.dimCompletedEpisodes;
  }
  if (typeof src.grayscaleCompleted !== "boolean" && typeof src.grayscaleCompletedEpisodes === "boolean") {
    next.grayscaleCompleted = src.grayscaleCompletedEpisodes;
  }
  if (typeof src.disableFloatingPlayer !== "boolean" && typeof src.disableGlobalPlayer === "boolean") {
    next.disableFloatingPlayer = src.disableGlobalPlayer;
  }
  if (typeof src.showFillers !== "boolean" && typeof src.fillers === "boolean") next.showFillers = src.fillers;
  if (typeof src.showRecaps !== "boolean" && typeof src.recaps === "boolean") next.showRecaps = src.recaps;
  for (const key of NUM_KEYS) {
    const raw = src[key];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) continue;
    if (key === "autoNextDelay") next.autoNextDelay = Math.min(30, Math.max(0, n));
    else if (key === "watchedThreshold") next.watchedThreshold = Math.min(100, Math.max(50, n));
    else if (key === "chunkSizeKb") next.chunkSizeKb = Math.min(512, Math.max(32, n));
    else if (key === "prescaleFactor") next.prescaleFactor = Math.min(4, Math.max(0.5, n));
    else if (key === "profileHue") next.profileHue = Math.min(360, Math.max(0, n));
    else (next[key] as number) = n;
  }
  if (typeof src.customThemeName === "string") next.customThemeName = src.customThemeName.trim().slice(0, 40) || defaultExtraSettings.customThemeName;
  next.colorTheme = asEnum(src.colorTheme, [...PRESET_THEMES.map((item) => item.name), "custom"] as const, "zinc");
  next.titleLanguage = asEnum(src.titleLanguage, ["english", "romaji"] as const, "english");
  next.viewMode = asEnum(src.viewMode, ["immersive", "theater"] as const, "immersive");
  next.fullscreenTarget = asEnum(src.fullscreenTarget, ["player", "document"] as const, "player");
  next.defaultQuality = asEnum(src.defaultQuality, ["auto", "1080p", "720p", "480p"] as const, "auto");
  next.defaultAudio = asEnum(src.defaultAudio, ["jpn", "eng"] as const, "jpn");
  next.streamCodec = asEnum(src.streamCodec, ["av1", "hevc"] as const, "av1");
  next.av1TranscodeQuality = asEnum(src.av1TranscodeQuality, ["balanced", "high"] as const, "balanced");
  next.profileAvatar = clipText(src.profileAvatar, 400_000);
  next.profileBanner = clipText(src.profileBanner, 400_000);
  next.customColorsLight = migrateColorMap(src.customColorsLight);
  next.customColorsDark = migrateColorMap(src.customColorsDark);
  next.thumbnailType = pickThumbnailType(src.thumbnailType);
  next.carouselDrag = pickCarouselDrag(src.carouselDrag);
  return next;
}

const COLOR_VAR: Record<string, string> = Object.fromEntries(COLOR_FIELDS.map((field) => [field.key, field.css]));

const PRESET_ACCENT: Record<PresetTheme, { dark: string; light: string }> = {
  zinc: { dark: "#a1a1aa", light: "#3f3f46" },
  rose: { dark: "#fb7185", light: "#e11d48" },
  blue: { dark: "#60a5fa", light: "#2563eb" },
  green: { dark: "#4ade80", light: "#16a34a" },
  orange: { dark: "#fb923c", light: "#ea580c" }
};

export function applyAppearance(prefs: {
  theme: "dark" | "light";
  useCustomColors: boolean;
  colorTheme: PresetTheme | "custom";
  customColorsLight: Partial<Record<ColorKey, string>>;
  customColorsDark: Partial<Record<ColorKey, string>>;
}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const field of COLOR_FIELDS) root.style.removeProperty(field.css);
  root.style.removeProperty("--color-destructive");
  if (prefs.useCustomColors) {
    const map = prefs.theme === "light" ? prefs.customColorsLight : prefs.customColorsDark;
    for (const [key, value] of Object.entries(map)) {
      const css = COLOR_VAR[key];
      if (css && value) root.style.setProperty(css, value);
    }
    return;
  }
  if (prefs.colorTheme === "zinc" || prefs.colorTheme === "custom") return;
  const accent = PRESET_ACCENT[prefs.colorTheme][prefs.theme];
  root.style.setProperty("--color-accent", accent);
  root.style.setProperty("--color-accent-ink", prefs.theme === "light" ? "#fafafa" : "#18181b");
}

export const defaultColorFallback: Record<"light" | "dark", Record<ColorKey, string>> = {
  light: {
    background: "#eef3f7",
    foreground: "#18181b",
    card: "#ffffff",
    cardForeground: "#18181b",
    popover: "#ffffff",
    popoverForeground: "#18181b",
    primary: "#18181b",
    primaryForeground: "#fafafa",
    secondary: "#f4f4f5",
    secondaryForeground: "#18181b",
    muted: "#f4f4f5",
    mutedForeground: "#71717a",
    accent: "#18181b",
    accentForeground: "#fafafa",
    border: "#e4e4e7",
    input: "#e4e4e7",
    ring: "#18181b",
    destructive: "#dc2626",
    sidebar: "#ffffff",
    sidebarForeground: "#3f3f46",
    sidebarAccent: "#f4f4f5",
    sidebarBorder: "#e4e4e7"
  },
  dark: {
    background: "#09090b",
    foreground: "#fafafa",
    card: "#18181b",
    cardForeground: "#fafafa",
    popover: "#18181b",
    popoverForeground: "#fafafa",
    primary: "#fafafa",
    primaryForeground: "#18181b",
    secondary: "#27272a",
    secondaryForeground: "#fafafa",
    muted: "#27272a",
    mutedForeground: "#a1a1aa",
    accent: "#fafafa",
    accentForeground: "#18181b",
    border: "#27272a",
    input: "#27272a",
    ring: "#d4d4d8",
    destructive: "#ef4444",
    sidebar: "#18181b",
    sidebarForeground: "#d4d4d8",
    sidebarAccent: "#27272a",
    sidebarBorder: "#27272a"
  }
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function truncateName(name: string, max = 12) {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
