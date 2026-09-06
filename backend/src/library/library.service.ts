import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ListStatus, PublishStatus } from "@prisma/client";

import { mapTitle, published, titleCard } from "../catalog/title-card";
import { PrismaService } from "../prisma/prisma.service";
import { fetchAniListList, normalizeTitle } from "./anilist";
import type { ProgressDto } from "./dto/progress.dto";
import type { ImportAniListDto, ImportListDto, ListStatusDto } from "./dto/list-status.dto";

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const [later, follows, history, continueWatching, lists] = await Promise.all([
      this.prisma.watchLater.findMany({
        where: { userId, title: published },
        orderBy: { createdAt: "desc" },
        include: { title: { select: titleCard } }
      }),
      this.prisma.follow.findMany({
        where: { userId, title: published },
        orderBy: { createdAt: "desc" },
        include: { title: { select: titleCard } }
      }),
      this.prisma.watchHistory.findMany({
        where: { userId, episode: { publish: PublishStatus.PUBLISHED } },
        orderBy: { watchedAt: "desc" },
        take: 24,
        include: {
          episode: {
            select: {
              id: true,
              name: true,
              number: true,
              season: { select: { title: { select: titleCard } } }
            }
          }
        }
      }),
      this.continueWatching(userId),
      this.prisma.listEntry.findMany({
        where: { userId, title: published },
        orderBy: { updatedAt: "desc" },
        include: { title: { select: titleCard } }
      })
    ]);

    const byStatus = {
      WATCHING: [] as ReturnType<typeof mapTitle>[],
      PLAN_TO_WATCH: [] as ReturnType<typeof mapTitle>[],
      ON_HOLD: [] as ReturnType<typeof mapTitle>[],
      DROPPED: [] as ReturnType<typeof mapTitle>[],
      COMPLETED: [] as ReturnType<typeof mapTitle>[]
    };
    for (const row of lists) {
      byStatus[row.status].push(mapTitle(row.title));
    }

    return {
      later: later.map((row) => mapTitle(row.title)),
      following: follows.map((row) => mapTitle(row.title)),
      lists: byStatus,
      history: history.map((row) => ({
        episodeId: row.episode.id,
        episodeName: row.episode.name,
        episodeNumber: row.episode.number,
        watchedAt: row.watchedAt,
        title: mapTitle(row.episode.season.title)
      })),
      continueWatching
    };
  }

  async continueWatching(userId: string) {
    const rows = await this.prisma.watchProgress.findMany({
      where: {
        userId,
        completed: false,
        episode: { publish: PublishStatus.PUBLISHED }
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        episode: {
          select: {
            id: true,
            name: true,
            durationSec: true,
            season: { select: { title: { select: titleCard } } }
          }
        }
      }
    });
    return rows.map((row) => ({
      ...mapTitle(row.episode.season.title),
      continueEpisodeId: row.episode.id,
      progress: row.durationSec
        ? Math.round((row.positionSec / row.durationSec) * 100)
        : 0
    }));
  }

  async saveProgress(userId: string, dto: ProgressDto) {
    const episode = await this.prisma.episode.findFirst({
      where: { id: dto.episodeId, ...published }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    const progress = await this.prisma.watchProgress.upsert({
      where: { userId_episodeId: { userId, episodeId: dto.episodeId } },
      update: {
        positionSec: dto.positionSec,
        durationSec: dto.durationSec,
        completed: dto.completed
      },
      create: {
        userId,
        episodeId: dto.episodeId,
        positionSec: dto.positionSec,
        durationSec: dto.durationSec,
        completed: dto.completed
      }
    });
    const recent = await this.prisma.watchHistory.findFirst({
      where: { userId, episodeId: dto.episodeId },
      orderBy: { watchedAt: "desc" }
    });
    const stale = !recent || Date.now() - recent.watchedAt.getTime() > 30 * 60 * 1000;
    if (stale) {
      await this.prisma.watchHistory.create({
        data: { userId, episodeId: dto.episodeId }
      });
    }
    return progress;
  }

  async toggleLater(userId: string, titleId: string) {
    await this.requireTitle(titleId);
    const existing = await this.prisma.watchLater.findUnique({
      where: { userId_titleId: { userId, titleId } }
    });
    if (existing) {
      await this.prisma.watchLater.delete({
        where: { userId_titleId: { userId, titleId } }
      });
      return { saved: false };
    }
    await this.prisma.watchLater.create({ data: { userId, titleId } });
    await this.prisma.listEntry.upsert({
      where: { userId_titleId: { userId, titleId } },
      update: {},
      create: { userId, titleId, status: ListStatus.PLAN_TO_WATCH }
    });
    return { saved: true };
  }

  async toggleFollow(userId: string, titleId: string) {
    await this.requireTitle(titleId);
    const existing = await this.prisma.follow.findUnique({
      where: { userId_titleId: { userId, titleId } }
    });
    if (existing) {
      await this.prisma.follow.delete({
        where: { userId_titleId: { userId, titleId } }
      });
      return { following: false };
    }
    await this.prisma.follow.create({ data: { userId, titleId } });
    return { following: true };
  }

  async setList(userId: string, titleId: string, dto: ListStatusDto) {
    await this.requireTitle(titleId);
    const row = await this.prisma.listEntry.upsert({
      where: { userId_titleId: { userId, titleId } },
      update: { status: dto.status, score: dto.score },
      create: { userId, titleId, status: dto.status, score: dto.score }
    });
    if (dto.status === ListStatus.PLAN_TO_WATCH) {
      await this.prisma.watchLater.upsert({
        where: { userId_titleId: { userId, titleId } },
        update: {},
        create: { userId, titleId }
      });
    }
    return { status: row.status, score: row.score };
  }

  async clearList(userId: string, titleId: string) {
    await this.prisma.listEntry.deleteMany({ where: { userId, titleId } });
    return { status: null };
  }

  async flags(userId: string, titleId: string) {
    const [later, follow, list] = await Promise.all([
      this.prisma.watchLater.findUnique({
        where: { userId_titleId: { userId, titleId } }
      }),
      this.prisma.follow.findUnique({
        where: { userId_titleId: { userId, titleId } }
      }),
      this.prisma.listEntry.findUnique({
        where: { userId_titleId: { userId, titleId } }
      })
    ]);
    return {
      saved: Boolean(later),
      following: Boolean(follow),
      listStatus: list?.status ?? null
    };
  }

  async clearHistory(userId: string) {
    await this.prisma.watchHistory.deleteMany({ where: { userId } });
    await this.prisma.watchProgress.deleteMany({ where: { userId } });
    return { ok: true };
  }

  async removeHistory(userId: string, episodeId: string) {
    await this.prisma.watchHistory.deleteMany({ where: { userId, episodeId } });
    await this.prisma.watchProgress.deleteMany({ where: { userId, episodeId } });
    return { ok: true };
  }

  async progressFor(userId: string, episodeId: string) {
    return this.prisma.watchProgress.findUnique({
      where: { userId_episodeId: { userId, episodeId } }
    });
  }

  async exportList(userId: string) {
    const [lists, follows] = await Promise.all([
      this.prisma.listEntry.findMany({
        where: { userId },
        include: { title: { select: { slug: true, name: true } } }
      }),
      this.prisma.follow.findMany({
        where: { userId },
        include: { title: { select: { slug: true, name: true } } }
      })
    ]);
    return {
      exportedAt: new Date().toISOString(),
      entries: lists.map((row) => ({
        slug: row.title.slug,
        name: row.title.name,
        status: row.status,
        score: row.score
      })),
      following: follows.map((row) => row.title.slug)
    };
  }

  async importList(userId: string, dto: ImportListDto) {
    return this.applyEntries(userId, dto.entries ?? []);
  }

  async importAniList(userId: string, dto: ImportAniListDto) {
    const username = dto.username.trim();
    try {
      const entries = await fetchAniListList(username);
      return this.applyEntries(userId, entries);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : "Could not read that AniList");
    }
  }

  private async applyEntries(
    userId: string,
    entries: { slug?: string; name?: string; status: ListStatus; score?: number }[]
  ) {
    const titles = await this.prisma.title.findMany({
      where: published,
      select: { id: true, slug: true, name: true }
    });
    const bySlug = new Map(titles.map((row) => [row.slug, row]));
    const byName = new Map(titles.map((row) => [normalizeTitle(row.name), row]));
    const unmatched: string[] = [];
    let imported = 0;

    for (const entry of entries) {
      const title =
        (entry.slug ? bySlug.get(entry.slug) : undefined) ??
        (entry.name ? byName.get(normalizeTitle(entry.name)) : undefined);
      if (!title) {
        unmatched.push(entry.name || entry.slug || "untitled");
        continue;
      }
      await this.prisma.listEntry.upsert({
        where: { userId_titleId: { userId, titleId: title.id } },
        update: { status: entry.status, score: entry.score },
        create: { userId, titleId: title.id, status: entry.status, score: entry.score }
      });
      imported += 1;
    }

    return { imported, unmatched };
  }

  private async requireTitle(titleId: string) {
    const title = await this.prisma.title.findFirst({
      where: { id: titleId, ...published }
    });
    if (!title) throw new NotFoundException("Title not found");
  }
}
