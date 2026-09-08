import { Prisma, PublishStatus } from "@prisma/client";

export const published = { publish: PublishStatus.PUBLISHED };

export const titleCard = {
  id: true,
  slug: true,
  type: true,
  status: true,
  name: true,
  nameJa: true,
  synopsis: true,
  year: true,
  hue: true,
  viewCount: true,
  spotlight: true,
  studio: true,
  ageRating: true,
  airSeason: true,
  scoreSum: true,
  scoreCount: true,
  posterUrl: true,
  backdropUrl: true,
  genres: { select: { genre: { select: { slug: true, name: true } } } },
  _count: { select: { follows: true } },
  seasons: {
    orderBy: { number: "asc" as const },
    select: {
      number: true,
      episodes: {
        where: published,
        select: { id: true, number: true, audioKind: true, airDate: true, videoUrl: true }
      }
    }
  }
} satisfies Prisma.TitleSelect;

export function scoreAvg(sum: number, count: number) {
  if (!count) return null;
  return Math.round((sum / count) * 10) / 10;
}

function demoInt(seed: string, min: number, max: number) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return min + ((hash >>> 0) % (max - min + 1));
}

function uniqueEpisodeCount(
  seasons: { episodes?: { number?: number; audioKind?: string }[] }[] | undefined,
  audio?: "SUB" | "DUB"
) {
  let count = 0;
  for (const season of seasons ?? []) {
    const numbers = new Set<number>();
    for (const episode of season.episodes ?? []) {
      const kind = episode.audioKind === "DUB" ? "DUB" : "SUB";
      if (audio && kind !== audio) continue;
      numbers.add(episode.number ?? 0);
    }
    count += numbers.size;
  }
  return count;
}

export function mapTitle<
  T extends {
    id?: string;
    slug?: string;
    type?: string;
    status?: string;
    year?: number | null;
    viewCount?: number;
    genres: { genre: { slug: string; name: string } }[];
    scoreSum?: number;
    scoreCount?: number;
    _count?: { follows?: number };
    seasons?: {
      episodes?: {
        id: string;
        number?: number;
        audioKind?: string;
        airDate?: Date | string | null;
        videoUrl?: string | null;
      }[];
    }[];
  }
>(row: T) {
  const seed = row.slug || row.id || "title";
  const aired = uniqueEpisodeCount(row.seasons);
  const uniqueSub = uniqueEpisodeCount(row.seasons, "SUB");
  const uniqueDub = uniqueEpisodeCount(row.seasons, "DUB");
  const avg = scoreAvg(row.scoreSum ?? 0, row.scoreCount ?? 0);
  const movie = row.type === "MOVIE";
  const completed = row.status === "COMPLETED" || movie;
  const planned = movie ? 1 : Math.max(aired, demoInt(`${seed}-eps`, 12, 24));
  const episodeTotal = completed ? Math.max(aired, movie ? 1 : 0) : planned;
  const shownAired = row.status === "UPCOMING" ? 0 : Math.max(aired, 1);
  const thinScores = (row.scoreCount ?? 0) < 80;

  return {
    ...row,
    genres: row.genres.map((g) => g.genre),
    year: row.year ?? demoInt(`${seed}-year`, 1998, 2026),
    score: !thinScores && avg != null ? avg : demoInt(`${seed}-score`, 71, 93) / 10,
    rating: !thinScores && avg != null ? Math.round(avg * 10) : demoInt(`${seed}-rate`, 71, 93),
    subCount: uniqueSub || demoInt(`${seed}-sub`, 1, Math.max(shownAired, 12)),
    dubCount: uniqueDub || demoInt(`${seed}-dub`, 1, Math.max(shownAired, 12)),
    likeCount: Math.max(
      row._count?.follows ?? 0,
      Math.round((row.viewCount ?? 0) * 0.14),
      demoInt(`${seed}-likes`, 96, 1860)
    ),
    episodeCount: shownAired,
    episodeTotal: Math.max(episodeTotal, shownAired, 1),
    scoreCount: thinScores ? demoInt(`${seed}-votes`, 180, 520) : (row.scoreCount ?? 0),
    nextAirDate: nextAirDate(row.seasons?.flatMap((season) => season.episodes ?? []) ?? [])
  };
}

function nextAirDate(episodes: { airDate?: Date | string | null }[]) {
  const times = episodes
    .map((item) => (item.airDate ? new Date(item.airDate).getTime() : NaN))
    .filter((value) => Number.isFinite(value));
  if (!times.length) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  const upcoming = times.filter((value) => value >= start).sort((a, b) => a - b);
  const pick = upcoming[0] ?? Math.min(...times);
  return new Date(pick).toISOString();
}
