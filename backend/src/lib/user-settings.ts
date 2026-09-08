const BOOL_KEYS = [
  "autoSkipEnding",
  "tapToPlayPause",
  "doubleTapSeekBack",
  "doubleTapSeekForward",
  "progressiveLoading",
  "showContinueWatching",
  "hideCaughtUp",
  "disableFloatingPlayer",
  "grayscaleCompleted",
  "dimCompleted",
  "blurThumbnails",
  "unblurWatched",
  "showFillers",
  "showRecaps",
  "privateProfile",
  "showBasicStats",
  "showFavorites",
  "showCompletionStats",
  "showMilestones",
  "showRatingDistribution",
  "showActivityGraph",
  "showActivityStats",
  "showRecentActivity",
  "showStatusDistribution",
  "showScoreDistribution",
  "showTypeDistribution",
  "showYearDistribution",
  "showSeasonDistribution",
  "showTopGenres",
  "showTopThemes",
  "showTopDemographics",
  "showTopStudios",
  "useCustomColors",
  "useLocalFonts",
  "notifyNewEpisodes",
  "notifyFollows",
  "notifyCommunity",
  "enablePushNotifications",
  "autoStart",
  "autoFullscreen",
  "pauseWhenNotInFocus",
  "enableSubtitles",
  "mobileLandscapeOnFullscreen",
  "av1CompatibilityFallback",
  "forceAv1Transcode"
] as const;

const NUM_KEYS = {
  autoNextDelay: [0, 30],
  watchedThreshold: [50, 100],
  skipOpeningButtonDuration: [1, 30],
  skipEndingButtonDuration: [1, 30],
  seekBackSeconds: [1, 60],
  seekForwardSeconds: [1, 60],
  chunkSizeKb: [32, 512],
  prescaleFactor: [0.5, 4],
  prescaleHeightLimit: [360, 4320],
  maxRenderHeight: [360, 4320],
  profileHue: [0, 360]
} as const;

const COLOR_KEYS = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "border",
  "input",
  "ring",
  "destructive",
  "sidebar",
  "sidebarForeground",
  "sidebarAccent",
  "sidebarBorder"
] as const;

const THUMBNAIL_SECTIONS = [
  "continueWatching",
  "latest",
  "popular",
  "recentlyUpdated",
  "seasonal",
  "history",
  "updates",
  "series"
] as const;

const CAROUSEL_SECTIONS = ["continueWatching", "latest", "popular", "recentlyUpdated", "seasonal"] as const;

export type UserSettings = {
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
  colorTheme: string;
  titleLanguage: string;
  viewMode: string;
  fullscreenTarget: string;
  defaultQuality: string;
  defaultAudio: string;
  streamCodec: string;
  av1TranscodeQuality: string;
  profileAvatar: string;
  profileBanner: string;
  customColorsLight: Record<string, string>;
  customColorsDark: Record<string, string>;
  thumbnailType: Record<string, string>;
  carouselDrag: Record<string, boolean>;
};

export const defaultUserSettings: UserSettings = {
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
  thumbnailType: {
    continueWatching: "frame",
    latest: "frame",
    popular: "frame",
    recentlyUpdated: "frame",
    seasonal: "frame",
    history: "frame",
    updates: "frame",
    series: "frame"
  },
  carouselDrag: {
    continueWatching: true,
    latest: true,
    popular: true,
    recentlyUpdated: true,
    seasonal: true
  }
};

function asBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNum(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function asEnum(value: unknown, allowed: string[], fallback: string) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function asHexMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const src = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  const aliases: Record<string, string> = {
    cardText: "cardForeground",
    popoverText: "popoverForeground",
    accentInk: "accentForeground",
    elevated: "secondary",
    line: "border",
    sidebarText: "sidebarForeground",
    sidebarActive: "sidebarAccent"
  };
  for (const [from, to] of Object.entries(aliases)) {
    const raw = src[from];
    if (typeof raw === "string" && /^#[0-9a-fA-F]{6}$/.test(raw)) out[to] = raw.toLowerCase();
  }
  for (const key of COLOR_KEYS) {
    const raw = src[key];
    if (typeof raw === "string" && /^#[0-9a-fA-F]{6}$/.test(raw)) out[key] = raw.toLowerCase();
  }
  return out;
}

export function sanitizeUserSettings(raw: unknown): UserSettings {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const next = {
    ...defaultUserSettings,
    thumbnailType: { ...defaultUserSettings.thumbnailType },
    carouselDrag: { ...defaultUserSettings.carouselDrag }
  };
  for (const key of BOOL_KEYS) {
    next[key] = asBool(src[key], defaultUserSettings[key]);
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
  for (const [key, range] of Object.entries(NUM_KEYS) as [keyof typeof NUM_KEYS, readonly [number, number]][]) {
    next[key] = asNum(src[key], defaultUserSettings[key], range[0], range[1]);
  }
  next.customThemeName =
    typeof src.customThemeName === "string" ? src.customThemeName.trim().slice(0, 40) || defaultUserSettings.customThemeName : defaultUserSettings.customThemeName;
  next.colorTheme = asEnum(src.colorTheme, ["zinc", "rose", "blue", "green", "orange", "custom"], "zinc");
  next.titleLanguage = asEnum(src.titleLanguage, ["english", "romaji"], "english");
  next.viewMode = asEnum(src.viewMode, ["immersive", "theater"], "immersive");
  next.fullscreenTarget = asEnum(src.fullscreenTarget, ["player", "document"], "player");
  next.defaultQuality = asEnum(src.defaultQuality, ["auto", "1080p", "720p", "480p"], "auto");
  next.defaultAudio = asEnum(src.defaultAudio, ["jpn", "eng"], "jpn");
  next.streamCodec = asEnum(src.streamCodec, ["av1", "hevc"], "av1");
  next.av1TranscodeQuality = asEnum(src.av1TranscodeQuality, ["balanced", "high"], "balanced");
  next.profileAvatar = typeof src.profileAvatar === "string" ? src.profileAvatar.slice(0, 400_000) : "";
  next.profileBanner = typeof src.profileBanner === "string" ? src.profileBanner.slice(0, 400_000) : "";
  next.customColorsLight = asHexMap(src.customColorsLight);
  next.customColorsDark = asHexMap(src.customColorsDark);
  const thumbs = src.thumbnailType && typeof src.thumbnailType === "object" && !Array.isArray(src.thumbnailType) ? (src.thumbnailType as Record<string, unknown>) : {};
  for (const key of THUMBNAIL_SECTIONS) {
    const value = thumbs[key];
    if (value === "frame" || value === "poster") next.thumbnailType[key] = value;
  }
  const drag = src.carouselDrag && typeof src.carouselDrag === "object" && !Array.isArray(src.carouselDrag) ? (src.carouselDrag as Record<string, unknown>) : {};
  for (const key of CAROUSEL_SECTIONS) {
    if (typeof drag[key] === "boolean") next.carouselDrag[key] = drag[key];
  }
  return next;
}

export function parseUserAgent(ua: string | undefined) {
  const raw = ua ?? "";
  let os = "Unknown";
  if (/Windows NT 10/i.test(raw)) os = "Windows 10";
  else if (/Windows NT 6\.1/i.test(raw)) os = "Windows 7";
  else if (/Mac OS X/i.test(raw)) os = "macOS";
  else if (/Android/i.test(raw)) os = "Android";
  else if (/iPhone|iPad/i.test(raw)) os = "iOS";
  else if (/Linux/i.test(raw)) os = "Linux";

  let browser = "Browser";
  const firefox = raw.match(/Firefox\/(\d+)/i);
  const edge = raw.match(/Edg\/(\d+)/i);
  const chrome = raw.match(/Chrome\/(\d+)/i);
  const safari = /Safari/i.test(raw) && !/Chrome/i.test(raw);
  if (firefox) browser = `Firefox ${firefox[1]}`;
  else if (edge) browser = `Edge ${edge[1]}`;
  else if (chrome) browser = `Chrome ${chrome[1]}`;
  else if (safari) browser = "Safari";

  return { os, browser };
}
