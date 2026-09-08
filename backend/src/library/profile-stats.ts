import { ListStatus, PublishStatus, Role } from "@prisma/client";

import { published } from "../catalog/title-card";
import { sanitizeUserSettings } from "../lib/user-settings";
import { PrismaService } from "../prisma/prisma.service";

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

const STATUS_ORDER: ListStatus[] = [
  "WATCHING",
  "COMPLETED",
  "ON_HOLD",
  "DROPPED",
  "PLAN_TO_WATCH"
];

export type ProfilePerson = {
  id: string;
  displayName: string;
  role: Role;
  createdAt: string;
  avatar?: string;
  banner?: string;
  hue?: number;
};

export type NamedCount = { slug: string; name: string; count: number };

export type ActivityPoint = { key: string; label: string; count: number };

export type ScoreStack = {
  score: number;
  WATCHING: number;
  COMPLETED: number;
  ON_HOLD: number;
  DROPPED: number;
  PLAN_TO_WATCH: number;
};

export type ProfileStats = {
  shows: number;
  episodes: number;
  watchTimeSec: number;
  meanScore: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  favorites: number;
  totalRewatches: number;
  dropRate: number;
  rewatchRate: number;
  topStudio: string | null;
  collection: { key: ListStatus; label: string; count: number }[];
  scores: number[];
  scoreStacks: ScoreStack[];
  genres: NamedCount[];
  themes: NamedCount[];
  demographics: NamedCount[];
  studios: NamedCount[];
  activity: {
    daily: ActivityPoint[];
    weekly: ActivityPoint[];
    monthly: ActivityPoint[];
  };
};

export type PublicProfile = {
  private: boolean;
  mine: boolean;
  user: ProfilePerson;
  stats: ProfileStats | null;
  visibility: ReturnType<typeof visibilityFromSettings>;
};

function visibilityFromSettings(settings: ReturnType<typeof sanitizeUserSettings>) {
  return {
    showBasicStats: settings.showBasicStats,
    showFavorites: settings.showFavorites,
    showCompletionStats: settings.showCompletionStats,
    showActivityStats: settings.showActivityStats,
    showActivityGraph: settings.showActivityGraph,
    showStatusDistribution: settings.showStatusDistribution,
    showScoreDistribution: settings.showScoreDistribution,
    showTopGenres: settings.showTopGenres,
    showTopThemes: settings.showTopThemes,
    showTopDemographics: settings.showTopDemographics,
    showTopStudios: settings.showTopStudios
  };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function streaksFromDays(days: string[]) {
  if (!days.length) return { current: 0, longest: 0 };
  const unique = [...new Set(days)].sort();
  const set = new Set(unique);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const prev = new Date(`${unique[i - 1]}T00:00:00.000Z`).getTime();
    const cur = new Date(`${unique[i]}T00:00:00.000Z`).getTime();
    if (cur - prev === 86_400_000) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  const today = dayKey(startOfDay(new Date()));
  const yesterday = dayKey(addDays(startOfDay(new Date()), -1));
  let current = 0;
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : "";
  while (cursor && set.has(cursor)) {
    current += 1;
    cursor = dayKey(addDays(new Date(`${cursor}T00:00:00.000Z`), -1));
  }
  return { current, longest: Math.max(longest, current) };
}

function topCounts(map: Map<string, { name: string; count: number }>, take = 8): NamedCount[] {
  return [...map.entries()]
    .map(([slug, value]) => ({ slug, name: value.name, count: value.count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, take);
}

function bump(map: Map<string, { name: string; count: number }>, slug: string, name: string) {
  const prev = map.get(slug);
  map.set(slug, { name, count: (prev?.count ?? 0) + 1 });
}

function emptyActivity(): ProfileStats["activity"] {
  const now = startOfDay(new Date());
  const daily: ActivityPoint[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = addDays(now, -i);
    const key = dayKey(date);
    daily.push({
      key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      count: 0
    });
  }
  const weekly: ActivityPoint[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = addDays(now, -i * 7);
    const key = dayKey(date);
    weekly.push({
      key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      count: 0
    });
  }
  const monthly: ActivityPoint[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    monthly.push({
      key,
      label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      count: 0
    });
  }
  return { daily, weekly, monthly };
}

function fillActivity(historyDays: { at: Date }[]) {
  const activity = emptyActivity();
  const dayMap = new Map(activity.daily.map((item) => [item.key, item]));
  const weekMap = new Map(activity.weekly.map((item) => [item.key, item]));
  const monthMap = new Map(activity.monthly.map((item) => [item.key, item]));
  for (const row of historyDays) {
    const day = dayKey(startOfDay(row.at));
    const dayItem = dayMap.get(day);
    if (dayItem) dayItem.count += 1;
    const monthKey = day.slice(0, 7);
    const monthItem = monthMap.get(monthKey);
    if (monthItem) monthItem.count += 1;
    for (const week of activity.weekly) {
      const start = new Date(`${week.key}T00:00:00.000Z`).getTime();
      const end = start + 7 * 86_400_000;
      const time = startOfDay(row.at).getTime();
      if (time >= start && time < end) {
        const item = weekMap.get(week.key);
        if (item) item.count += 1;
        break;
      }
    }
  }
  return activity;
}

const STATUS_LABEL: Record<ListStatus, string> = {
  WATCHING: "Watching",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  DROPPED: "Dropped",
  PLAN_TO_WATCH: "Plan to Watch"
};

export async function buildProfileStats(prisma: PrismaService, userId: string): Promise<ProfileStats> {
  const [lists, history, progress, ratings, favorites] = await Promise.all([
    prisma.listEntry.findMany({
      where: { userId, title: published },
      select: {
        status: true,
        score: true,
        titleId: true,
        title: {
          select: {
            studio: true,
            genres: { select: { genre: { select: { slug: true, name: true } } } }
          }
        }
      }
    }),
    prisma.watchHistory.findMany({
      where: { userId, episode: { publish: PublishStatus.PUBLISHED } },
      select: { episodeId: true, watchedAt: true },
      orderBy: { watchedAt: "asc" },
      take: 4000
    }),
    prisma.watchProgress.findMany({
      where: { userId },
      select: { positionSec: true, durationSec: true, completed: true }
    }),
    prisma.rating.findMany({ where: { userId }, select: { score: true, titleId: true } }),
    prisma.follow.count({ where: { userId, title: published } })
  ]);

  const collection = STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_LABEL[key],
    count: lists.filter((row) => row.status === key).length
  }));
  const shows = lists.length;
  const completed = collection.find((item) => item.key === "COMPLETED")?.count ?? 0;
  const dropped = collection.find((item) => item.key === "DROPPED")?.count ?? 0;
  const uniqueEpisodes = new Set(history.map((row) => row.episodeId));
  const episodes = uniqueEpisodes.size;
  const totalRewatches = Math.max(0, history.length - episodes);
  const rewatchRate = episodes ? Math.round((totalRewatches / episodes) * 1000) / 10 : 0;
  const dropRate = shows ? Math.round((dropped / shows) * 1000) / 10 : 0;
  const completionRate = shows ? Math.round((completed / shows) * 100) : 0;
  const watchTimeSec = progress.reduce((sum, row) => {
    if (row.completed && row.durationSec) return sum + row.durationSec;
    return sum + Math.max(0, row.positionSec);
  }, 0);

  const scoredByTitle = new Map<string, { score: number; status: ListStatus }>();
  for (const row of lists) {
    if (typeof row.score === "number" && row.score >= 1 && row.score <= 10) {
      scoredByTitle.set(row.titleId, { score: row.score, status: row.status });
    }
  }
  const listStatusByTitle = new Map(lists.map((row) => [row.titleId, row.status]));
  for (const row of ratings) {
    if (row.score < 1 || row.score > 10) continue;
    if (scoredByTitle.has(row.titleId)) continue;
    scoredByTitle.set(row.titleId, {
      score: row.score,
      status: listStatusByTitle.get(row.titleId) ?? "COMPLETED"
    });
  }
  const scoreStacks: ScoreStack[] = Array.from({ length: 10 }, (_, index) => ({
    score: index + 1,
    WATCHING: 0,
    COMPLETED: 0,
    ON_HOLD: 0,
    DROPPED: 0,
    PLAN_TO_WATCH: 0
  }));
  for (const item of scoredByTitle.values()) {
    const bucket = scoreStacks[item.score - 1];
    if (bucket) bucket[item.status] += 1;
  }
  const scores = scoreStacks.map(
    (row) => row.WATCHING + row.COMPLETED + row.ON_HOLD + row.DROPPED + row.PLAN_TO_WATCH
  );
  const scored = [...scoredByTitle.values()].map((item) => item.score);
  const meanScore = scored.length
    ? Math.round((scored.reduce((sum, score) => sum + score, 0) / scored.length) * 10) / 10
    : 0;

  const genres = new Map<string, { name: string; count: number }>();
  const themes = new Map<string, { name: string; count: number }>();
  const demographics = new Map<string, { name: string; count: number }>();
  const studios = new Map<string, { name: string; count: number }>();
  for (const row of lists) {
    if (row.title.studio?.trim()) {
      const name = row.title.studio.trim();
      bump(studios, name.toLowerCase(), name);
    }
    for (const item of row.title.genres) {
      const slug = item.genre.slug;
      if (DEMO_SLUGS.has(slug)) bump(demographics, slug, item.genre.name);
      else if (THEME_SLUGS.has(slug)) bump(themes, slug, item.genre.name);
      else bump(genres, slug, item.genre.name);
    }
  }

  const { current, longest } = streaksFromDays(history.map((row) => dayKey(startOfDay(row.watchedAt))));
  const studioList = topCounts(studios);

  return {
    shows,
    episodes,
    watchTimeSec,
    meanScore,
    currentStreak: current,
    longestStreak: longest,
    completionRate,
    favorites,
    totalRewatches,
    dropRate,
    rewatchRate,
    topStudio: studioList[0]?.name ?? null,
    collection,
    scores,
    scoreStacks,
    genres: topCounts(genres),
    themes: topCounts(themes),
    demographics: topCounts(demographics),
    studios: studioList,
    activity: fillActivity(history.map((row) => ({ at: row.watchedAt })))
  };
}

export async function loadPublicProfile(
  prisma: PrismaService,
  userId: string,
  viewerId?: string | null
): Promise<PublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true, role: true, createdAt: true, settings: true }
  });
  if (!user) return null;
  const settings = sanitizeUserSettings(user.settings);
  const mine = viewerId === user.id;
  const person: ProfilePerson = {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    avatar: typeof settings.profileAvatar === "string" ? settings.profileAvatar : "",
    banner: typeof settings.profileBanner === "string" ? settings.profileBanner : "",
    hue: settings.profileHue
  };
  if (settings.privateProfile && !mine) {
    return { private: true, mine, user: person, stats: null, visibility: visibilityFromSettings(settings) };
  }
  return {
    private: false,
    mine,
    user: person,
    stats: await buildProfileStats(prisma, user.id),
    visibility: visibilityFromSettings(settings)
  };
}
