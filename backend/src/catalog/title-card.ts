import { Prisma, PublishStatus } from "@prisma/client";

export const published = { publish: PublishStatus.PUBLISHED };

export const titleCard = {
  id: true,
  slug: true,
  type: true,
  status: true,
  name: true,
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
  seasons: {
    orderBy: { number: "asc" as const },
    select: {
      number: true,
      episodes: { where: published, select: { id: true, audioKind: true, airDate: true } }
    }
  }
} satisfies Prisma.TitleSelect;

export function scoreAvg(sum: number, count: number) {
  if (!count) return null;
  return Math.round((sum / count) * 10) / 10;
}

export function mapTitle<
  T extends {
    genres: { genre: { slug: string; name: string } }[];
    scoreSum?: number;
    scoreCount?: number;
    seasons?: { episodes?: { id: string; audioKind?: string; airDate?: Date | string | null }[] }[];
  }
>(row: T) {
  const episodes = row.seasons?.flatMap((season) => season.episodes ?? []) ?? [];
  return {
    ...row,
    genres: row.genres.map((g) => g.genre),
    score: scoreAvg(row.scoreSum ?? 0, row.scoreCount ?? 0),
    subCount: episodes.filter((item) => item.audioKind !== "DUB").length,
    dubCount: episodes.filter((item) => item.audioKind === "DUB").length,
    episodeCount: episodes.length,
    nextAirDate: nextAirDate(episodes)
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
