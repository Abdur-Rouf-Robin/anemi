import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { mapTitle, published, titleCard } from "../catalog/title-card";
import { PrismaService } from "../prisma/prisma.service";
import { playlistSlug } from "./playlist-slug";

const MAX_PLAYLISTS = 20;
const MAX_ITEMS = 48;

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.playlist.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { title: { select: titleCard } }
        }
      }
    });
    return rows.map((row) => ({ ...this.mapPlaylist(row), mine: true }));
  }

  async one(id: string, userId?: string | null) {
    const row = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          where: { title: published },
          orderBy: { position: "asc" },
          include: { title: { select: titleCard } }
        }
      }
    });
    if (!row) throw new NotFoundException("Playlist not found");
    return { ...this.mapPlaylist(row), mine: Boolean(userId && row.userId === userId) };
  }

  async create(userId: string, name: string) {
    const count = await this.prisma.playlist.count({ where: { userId } });
    if (count >= MAX_PLAYLISTS) {
      throw new BadRequestException(`At most ${MAX_PLAYLISTS} playlists`);
    }
    const slug = await this.uniqueSlug(userId, name);
    const row = await this.prisma.playlist.create({
      data: { userId, name: name.trim(), slug },
      include: { items: { include: { title: { select: titleCard } } } }
    });
    return this.mapPlaylist(row);
  }

  async rename(userId: string, id: string, name: string) {
    await this.owned(userId, id);
    const slug = await this.uniqueSlug(userId, name, id);
    const row = await this.prisma.playlist.update({
      where: { id },
      data: { name: name.trim(), slug },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { title: { select: titleCard } }
        }
      }
    });
    return this.mapPlaylist(row);
  }

  async remove(userId: string, id: string) {
    await this.owned(userId, id);
    await this.prisma.playlist.delete({ where: { id } });
    return { ok: true };
  }

  async addItem(userId: string, id: string, titleId: string) {
    await this.owned(userId, id);
    const title = await this.prisma.title.findFirst({ where: { id: titleId, ...published } });
    if (!title) throw new NotFoundException("Title not found");
    const items = await this.prisma.playlistItem.findMany({ where: { playlistId: id } });
    if (items.some((item) => item.titleId === titleId)) {
      return this.one(id);
    }
    if (items.length >= MAX_ITEMS) {
      throw new BadRequestException(`At most ${MAX_ITEMS} titles per playlist`);
    }
    const position = items.reduce((max, item) => Math.max(max, item.position), 0) + 1;
    await this.prisma.playlistItem.create({
      data: { playlistId: id, titleId, position }
    });
    await this.prisma.playlist.update({ where: { id }, data: { updatedAt: new Date() } });
    return this.one(id);
  }

  async removeItem(userId: string, id: string, titleId: string) {
    await this.owned(userId, id);
    await this.prisma.playlistItem.deleteMany({ where: { playlistId: id, titleId } });
    return this.one(id);
  }

  private async owned(userId: string, id: string) {
    const row = await this.prisma.playlist.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException("Playlist not found");
    return row;
  }

  private async uniqueSlug(userId: string, name: string, exceptId?: string) {
    const base = playlistSlug(name);
    let slug = base;
    let n = 2;
    while (true) {
      const clash = await this.prisma.playlist.findFirst({
        where: { userId, slug, ...(exceptId ? { id: { not: exceptId } } : {}) }
      });
      if (!clash) return slug;
      slug = `${base}-${n++}`;
    }
  }

  private mapPlaylist(row: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    items: { title: Parameters<typeof mapTitle>[0] }[];
  }) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      itemCount: row.items.length,
      items: row.items.map((item) => mapTitle(item.title))
    };
  }
}
