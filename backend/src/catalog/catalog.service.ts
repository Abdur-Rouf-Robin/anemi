import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PublishStatus } from "@prisma/client";

import { publicSiteUrl } from "../lib/public-site-url";
import { studioSlug } from "../lib/studio-slug";
import { PrismaService } from "../prisma/prisma.service";
import { QueryTitlesDto } from "./dto/query-titles.dto";
import { buildLatestRss, buildScheduleIcs } from "./feeds";
import { mapTitle, published, scoreAvg, titleCard } from "./title-card";
import { normalizeHomeConfig } from "./home-config";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  genres() {
    return this.prisma.genre.findMany({ orderBy: { name: "asc" } });
  }

  async announcement() {
    const row = await this.prisma.siteSetting.findUnique({ where: { id: "default" } });
    return {
      announcement: row?.announcement ?? null,
      announcementHref: row?.announcementHref ?? null,
      communityGuidelines: row?.communityGuidelines ?? null
    };
  }

  async home() {
    const setting = await this.prisma.siteSetting.findUnique({ where: { id: "default" } });
    const config = normalizeHomeConfig(setting?.homeConfig);
    const [
      spotlightsRaw,
      trending,
      moviesRaw,
      series,
      animation,
      airing,
      upcoming,
      latestRows,
      completed,
      added,
      featuredGenreRows
    ] = await Promise.all([
      config.spotlightIds.length
        ? this.prisma.title.findMany({
            where: { id: { in: config.spotlightIds }, ...published },
            select: titleCard
          })
        : this.prisma.title.findMany({
            where: { ...published, spotlight: true },
            orderBy: { viewCount: "desc" },
            take: 6,
            select: titleCard
          }),
      this.prisma.title.findMany({
        where: published,
        orderBy: { viewCount: "desc" },
        take: 12,
        select: titleCard
      }),
      config.featuredIds.length
        ? this.prisma.title.findMany({
            where: { id: { in: config.featuredIds }, ...published },
            select: titleCard
          })
        : this.prisma.title.findMany({
            where: { ...published, type: "MOVIE" },
            orderBy: { year: "desc" },
            take: 12,
            select: titleCard
          }),
      this.prisma.title.findMany({
        where: { ...published, type: "SERIES" },
        orderBy: { viewCount: "desc" },
        take: 12,
        select: titleCard
      }),
      this.prisma.title.findMany({
        where: { ...published, type: { in: ["OVA", "ONA", "SPECIAL"] } },
        orderBy: { year: "desc" },
        take: 12,
        select: titleCard
      }),
      this.prisma.title.findMany({
        where: { ...published, status: "AIRING" },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: titleCard
      }),
      this.prisma.title.findMany({
        where: { ...published, status: "UPCOMING" },
        orderBy: { year: "desc" },
        take: 12,
        select: titleCard
      }),
      this.latestEpisodes(40),
      this.prisma.title.findMany({
        where: { ...published, status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: titleCard
      }),
      this.prisma.title.findMany({
        where: published,
        orderBy: { createdAt: "desc" },
        take: 12,
        select: titleCard
      }),
      config.genreSlugs.length
        ? this.prisma.genre.findMany({ where: { slug: { in: config.genreSlugs } } })
        : this.prisma.genre.findMany({ orderBy: { name: "asc" }, take: 6 })
    ]);

    const spotlights = orderMapped(spotlightsRaw, config.spotlightIds);
    const movies = orderMapped(moviesRaw, config.featuredIds);
    const featuredGenres = config.genreSlugs.length
      ? config.genreSlugs
          .map((slug) => featuredGenreRows.find((row) => row.slug === slug))
          .filter((row): row is NonNullable<typeof row> => Boolean(row))
          .map((row) => ({ slug: row.slug, name: row.name }))
      : featuredGenreRows.map((row) => ({ slug: row.slug, name: row.name }));
    const watchNextRow = config.watchNextTitleId
      ? await this.prisma.title.findFirst({
          where: { id: config.watchNextTitleId, ...published },
          select: titleCard
        })
      : null;
    const charts = await this.charts();
    const latest = uniqueTitles(latestRows.map((row) => row.title), 12);
    const upcomingCards = upcoming
      .map(mapTitle)
      .sort((a, b) => airDateSort(a.nextAirDate) - airDateSort(b.nextAirDate));
    const collections = await this.collectionShelves(config.collections);
    return {
      spotlight: spotlights[0] ?? null,
      spotlights,
      trending: trending.map(mapTitle),
      movies,
      series: series.map(mapTitle),
      animation: animation.map(mapTitle),
      airing: airing.map(mapTitle),
      upcoming: upcomingCards,
      completed: completed.map(mapTitle),
      added: added.map(mapTitle),
      latest,
      charts,
      featuredGenres,
      homeSections: config.sections,
      watchNextTitle: watchNextRow ? mapTitle(watchNextRow) : null,
      collections
    };
  }

  async collection(slug: string) {
    const setting = await this.prisma.siteSetting.findUnique({ where: { id: "default" } });
    const config = normalizeHomeConfig(setting?.homeConfig);
    const shelf = config.collections.find((item) => item.slug === slug);
    if (!shelf) throw new NotFoundException("Collection not found");
    const [mapped] = await this.collectionShelves([shelf]);
    if (!mapped) throw new NotFoundException("Collection not found");
    return mapped;
  }

  private async collectionShelves(shelves: { name: string; slug: string; titleIds: string[] }[]) {
    const mapped = await Promise.all(
      shelves.map(async (shelf) => {
        if (!shelf.titleIds.length) return null;
        const rows = await this.prisma.title.findMany({
          where: { id: { in: shelf.titleIds }, ...published },
          select: titleCard
        });
        const items = orderMapped(rows, shelf.titleIds);
        if (!items.length) return null;
        return { name: shelf.name, slug: shelf.slug, items };
      })
    );
    return mapped.filter((row) => row !== null);
  }

  async discover() {
    const month = new Date().getMonth();
    const season = month < 3 ? "WINTER" : month < 6 ? "SPRING" : month < 9 ? "SUMMER" : "FALL";
    const [seasonal, scored, updated] = await Promise.all([
      this.prisma.title.findMany({
        where: { ...published, airSeason: season, status: { in: ["AIRING", "UPCOMING"] } },
        orderBy: { viewCount: "desc" },
        take: 16,
        select: titleCard
      }),
      this.prisma.title.findMany({
        where: { ...published, scoreCount: { gt: 0 } },
        orderBy: { scoreSum: "desc" },
        take: 16,
        select: titleCard
      }),
      this.prisma.title.findMany({
        where: published,
        orderBy: { updatedAt: "desc" },
        take: 16,
        select: titleCard
      })
    ]);
    return {
      season,
      seasonal: seasonal.map(mapTitle),
      scored: scored.map(mapTitle),
      updated: updated.map(mapTitle)
    };
  }

  async related(slug: string) {
    const title = await this.prisma.title.findFirst({
      where: { slug, ...published },
      include: { genres: { select: { genreId: true } } }
    });
    if (!title) throw new NotFoundException("Title not found");
    const genreIds = title.genres.map((row) => row.genreId);
    const [genreRows, studioRows] = await Promise.all([
      this.prisma.title.findMany({
        where: {
          ...published,
          id: { not: title.id },
          ...(genreIds.length ? { genres: { some: { genreId: { in: genreIds } } } } : {})
        },
        orderBy: { viewCount: "desc" },
        take: 8,
        select: titleCard
      }),
      title.studio
        ? this.prisma.title.findMany({
            where: { ...published, id: { not: title.id }, studio: title.studio },
            orderBy: { viewCount: "desc" },
            take: 6,
            select: titleCard
          })
        : Promise.resolve([])
    ]);
    return { items: uniqueTitles([...studioRows, ...genreRows].map(mapTitle), 10) };
  }

  async titles(query: QueryTitlesDto) {
    const take = query.take ?? 24;
    const where: Prisma.TitleWhereInput = {
      ...published,
      ...(query.type === "ANIMATION"
        ? { type: { in: ["OVA", "ONA", "SPECIAL"] } }
        : query.type
          ? { type: query.type }
          : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.season ? { airSeason: query.season } : {}),
      ...(query.genre ? { genres: { some: { genre: { slug: query.genre } } } } : {}),
      ...(query.audio
        ? { seasons: { some: { episodes: { some: { ...published, audioKind: query.audio } } } } }
        : {}),
      ...(query.letter
        ? {
            name: {
              startsWith: query.letter === "#" ? undefined : query.letter,
              mode: "insensitive"
            }
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { nameJa: { contains: query.q, mode: "insensitive" } },
              { synopsis: { contains: query.q, mode: "insensitive" } },
              { studio: { contains: query.q, mode: "insensitive" } }
            ]
          }
        : {})
    };

    if (query.letter === "#") {
      where.name = { lt: "A", mode: "insensitive" };
    }

    const orderBy: Prisma.TitleOrderByWithRelationInput =
      query.sort === "newest"
        ? { year: "desc" }
        : query.sort === "az"
          ? { name: "asc" }
          : query.sort === "score"
            ? { scoreSum: "desc" }
            : query.sort === "updated"
              ? { updatedAt: "desc" }
              : { viewCount: "desc" };

    if (query.studio) {
      const names = await this.studioNamesForSlug(query.studio);
      if (!names.length) return { items: [], total: 0 };
      where.studio = { in: names };
    }

    const skip = query.skip ?? 0;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.title.findMany({
        where,
        orderBy,
        take,
        skip,
        select: titleCard
      }),
      this.prisma.title.count({ where })
    ]);

    return { items: rows.map(mapTitle), total };
  }

  async az(letter?: string) {
    const items = await this.titles({ letter, sort: "az", take: 80 });
    return items;
  }

  async random() {
    const count = await this.prisma.title.count({ where: published });
    if (!count) throw new NotFoundException("No titles yet");
    const skip = Math.floor(Math.random() * count);
    const row = await this.prisma.title.findFirst({
      where: published,
      skip,
      select: titleCard
    });
    if (!row) throw new NotFoundException("Title not found");
    return mapTitle(row);
  }

  async latest(audio?: "SUB" | "DUB", take = 24) {
    return { items: await this.latestEpisodes(take, audio) };
  }

  async latestRss() {
    return buildLatestRss(publicSiteUrl(), await this.latestEpisodes(48));
  }

  async scheduleIcs() {
    const { days } = await this.schedule();
    return buildScheduleIcs(publicSiteUrl(), days);
  }

  async schedule() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    const rows = await this.prisma.episode.findMany({
      where: {
        ...published,
        airDate: { gte: start, lte: end },
        season: { title: published }
      },
      orderBy: { airDate: "asc" },
      select: {
        id: true,
        number: true,
        name: true,
        audioKind: true,
        airDate: true,
        durationSec: true,
        season: { select: { number: true, title: { select: titleCard } } }
      }
    });
    const days = new Map<string, ReturnType<typeof this.mapEpisodeCard>[]>();
    for (const row of rows) {
      const key = (row.airDate ?? new Date()).toISOString().slice(0, 10);
      const list = days.get(key) ?? [];
      list.push(this.mapEpisodeCard(row));
      days.set(key, list);
    }
    return {
      days: [...days.entries()].map(([date, items]) => ({ date, items }))
    };
  }

  async studios() {
    const rows = await this.prisma.title.findMany({
      where: { ...published, studio: { not: null } },
      select: { studio: true }
    });
    const map = new Map<string, { name: string; slug: string; count: number }>();
    for (const row of rows) {
      const name = row.studio?.trim();
      if (!name) continue;
      const slug = studioSlug(name);
      const current = map.get(slug);
      if (current) current.count += 1;
      else map.set(slug, { name, slug, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async studio(slug: string) {
    const names = await this.studioNamesForSlug(slug);
    if (!names.length) throw new NotFoundException("Studio not found");
    const items = await this.prisma.title.findMany({
      where: { ...published, studio: { in: names } },
      orderBy: { name: "asc" },
      select: titleCard
    });
    return { name: names[0], slug, items: items.map(mapTitle) };
  }

  private async studioNamesForSlug(slug: string) {
    const rows = await this.prisma.title.findMany({
      where: { ...published, studio: { not: null } },
      distinct: ["studio"],
      select: { studio: true }
    });
    return rows.map((row) => row.studio!).filter((name) => studioSlug(name) === slug);
  }

  async charts() {
    const now = Date.now();
    const windows = {
      day: new Date(now - 24 * 60 * 60 * 1000),
      week: new Date(now - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now - 30 * 24 * 60 * 60 * 1000)
    };
    const [day, week, month] = await Promise.all(
      Object.values(windows).map((since) => this.chartSince(since))
    );
    return { day, week, month };
  }

  async titleBySlug(slug: string) {
    const row = await this.prisma.title.findFirst({
      where: { slug, ...published },
      include: {
        genres: { select: { genre: { select: { slug: true, name: true } } } },
        seasons: {
          orderBy: { number: "asc" },
          include: {
            episodes: {
              where: published,
              orderBy: [{ number: "asc" }, { audioKind: "desc" }, { language: "asc" }],
              select: {
                id: true,
                number: true,
                slug: true,
                name: true,
                synopsis: true,
                durationSec: true,
                audioKind: true,
                language: true,
                airDate: true,
                introStartSec: true,
                introEndSec: true,
                outroStartSec: true,
                subtitleUrl: true,
                videoUrl: true,
                kind: true,
                viewCount: true,
                _count: { select: { comments: true } }
              }
            }
          }
        }
      }
    });
    if (!row) throw new NotFoundException("Title not found");
    return {
      ...mapTitle(row),
      seasons: row.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((episode) => {
          const { _count, ...rest } = episode;
          return { ...rest, commentCount: _count.comments };
        })
      }))
    };
  }

  async episode(id: string) {
    const episode = await this.prisma.episode.findFirst({
      where: { id, ...published },
      include: {
        captions: { select: { language: true, url: true } },
        season: {
          include: {
            title: {
              select: titleCard
            },
            episodes: {
              where: published,
              orderBy: [{ number: "asc" }, { audioKind: "desc" }, { language: "asc" }],
              select: {
                id: true,
                number: true,
                name: true,
                durationSec: true,
                audioKind: true,
                language: true,
                videoUrl: true,
                subtitleUrl: true,
                kind: true,
                captions: { select: { language: true, url: true } }
              }
            }
          }
        }
      }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    return {
      ...episode,
      season: {
        ...episode.season,
        title: mapTitle(episode.season.title)
      }
    };
  }

  async recordView(id: string) {
    const episode = await this.prisma.episode.findFirst({
      where: { id, ...published },
      select: { id: true, season: { select: { titleId: true } } }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    await this.prisma.$transaction([
      this.prisma.episode.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      }),
      this.prisma.title.update({
        where: { id: episode.season.titleId },
        data: { viewCount: { increment: 1 } }
      }),
      this.prisma.viewEvent.create({
        data: { titleId: episode.season.titleId }
      })
    ]);
    return { ok: true };
  }

  async rate(userId: string, slug: string, score: number) {
    const title = await this.prisma.title.findFirst({ where: { slug, ...published } });
    if (!title) throw new NotFoundException("Title not found");
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.rating.findUnique({
        where: { userId_titleId: { userId, titleId: title.id } }
      });
      if (existing) {
        await tx.rating.update({
          where: { userId_titleId: { userId, titleId: title.id } },
          data: { score }
        });
        await tx.title.update({
          where: { id: title.id },
          data: { scoreSum: { increment: score - existing.score } }
        });
      } else {
        await tx.rating.create({ data: { userId, titleId: title.id, score } });
        await tx.title.update({
          where: { id: title.id },
          data: { scoreSum: { increment: score }, scoreCount: { increment: 1 } }
        });
      }
    });
    const next = await this.prisma.title.findUniqueOrThrow({
      where: { id: title.id },
      select: { scoreSum: true, scoreCount: true }
    });
    return { score: scoreAvg(next.scoreSum, next.scoreCount), mine: score };
  }

  async myRating(userId: string | null, slug: string) {
    if (!userId) return { mine: null };
    const title = await this.prisma.title.findFirst({ where: { slug, ...published } });
    if (!title) throw new NotFoundException("Title not found");
    const row = await this.prisma.rating.findUnique({
      where: { userId_titleId: { userId, titleId: title.id } }
    });
    return { mine: row?.score ?? null };
  }

  private async latestEpisodes(take: number, audio?: "SUB" | "DUB") {
    const rows = await this.prisma.episode.findMany({
      where: {
        ...published,
        ...(audio ? { audioKind: audio } : {}),
        season: { title: published }
      },
      orderBy: [{ airDate: "desc" }, { id: "desc" }],
      take,
      select: {
        id: true,
        number: true,
        name: true,
        audioKind: true,
        airDate: true,
        durationSec: true,
        season: { select: { number: true, title: { select: titleCard } } }
      }
    });
    return rows.map((row) => this.mapEpisodeCard(row));
  }

  private mapEpisodeCard(row: {
    id: string;
    number: number;
    name: string;
    audioKind: string;
    airDate: Date | null;
    durationSec: number | null;
    season: { number: number; title: Prisma.TitleGetPayload<{ select: typeof titleCard }> };
  }) {
    return {
      episodeId: row.id,
      number: row.number,
      name: row.name,
      audioKind: row.audioKind,
      airDate: row.airDate,
      durationSec: row.durationSec,
      seasonNumber: row.season.number,
      title: { ...mapTitle(row.season.title), continueEpisodeId: row.id }
    };
  }

  private async chartSince(since: Date) {
    const grouped = await this.prisma.viewEvent.groupBy({
      by: ["titleId"],
      where: { createdAt: { gte: since } },
      _count: { titleId: true },
      orderBy: { _count: { titleId: "desc" } },
      take: 10
    });
    if (!grouped.length) {
      const fallback = await this.prisma.title.findMany({
        where: published,
        orderBy: { viewCount: "desc" },
        take: 10,
        select: titleCard
      });
      return fallback.map(mapTitle);
    }
    const titles = await this.prisma.title.findMany({
      where: { id: { in: grouped.map((row) => row.titleId) }, ...published },
      select: titleCard
    });
    const byId = new Map(titles.map((row) => [row.id, mapTitle(row)]));
    return grouped
      .map((row) => {
        const title = byId.get(row.titleId);
        return title ? { ...title, windowViews: row._count.titleId } : null;
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }
}

function orderMapped<T extends Parameters<typeof mapTitle>[0] & { id: string }>(rows: T[], ids: string[]) {
  const mapped = rows.map((row) => mapTitle(row));
  if (!ids.length) return mapped;
  const byId = new Map(mapped.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function uniqueTitles<T extends { id: string }>(items: T[], take = items.length) {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
    if (unique.length >= take) break;
  }
  return unique;
}

function airDateSort(value?: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}
