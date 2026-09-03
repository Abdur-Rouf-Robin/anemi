import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PublishStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TogetherService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, episodeId: string) {
    const episode = await this.prisma.episode.findFirst({
      where: { id: episodeId, publish: PublishStatus.PUBLISHED }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    const code = randomBytes(4).toString("hex");
    return this.prisma.watchRoom.create({
      data: { code, episodeId, hostId: userId }
    });
  }

  async get(code: string) {
    const room = await this.prisma.watchRoom.findFirst({
      where: { code: { equals: code, mode: "insensitive" } },
      include: {
        host: { select: { displayName: true } },
        episode: {
          select: {
            id: true,
            name: true,
            number: true,
            videoUrl: true,
            subtitleUrl: true,
            durationSec: true,
            audioKind: true,
            introStartSec: true,
            introEndSec: true,
            outroStartSec: true,
            season: { select: { number: true, title: { select: { name: true, slug: true, hue: true } } } }
          }
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
          include: { user: { select: { displayName: true } } }
        }
      }
    });
    if (!room) throw new NotFoundException("Room not found");
    return {
      code: room.code,
      hostId: room.hostId,
      hostName: room.host.displayName,
      positionSec: room.positionSec,
      playing: room.playing,
      episode: room.episode,
      messages: room.messages.map((row) => ({
        id: row.id,
        body: row.body,
        createdAt: row.createdAt,
        displayName: row.user.displayName
      }))
    };
  }

  async sync(userId: string, code: string, positionSec: number, playing: boolean) {
    const room = await this.prisma.watchRoom.findFirst({
      where: { code: { equals: code, mode: "insensitive" } }
    });
    if (!room) throw new NotFoundException("Room not found");
    if (room.hostId !== userId) throw new ForbiddenException("Only the host can sync playback");
    return this.prisma.watchRoom.update({
      where: { id: room.id },
      data: { positionSec: Math.max(0, Math.floor(positionSec)), playing }
    });
  }

  async chat(userId: string, code: string, body: string) {
    const room = await this.prisma.watchRoom.findFirst({
      where: { code: { equals: code, mode: "insensitive" } }
    });
    if (!room) throw new NotFoundException("Room not found");
    const row = await this.prisma.roomMessage.create({
      data: { roomId: room.id, userId, body: body.trim() },
      include: { user: { select: { displayName: true } } }
    });
    return {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      displayName: row.user.displayName
    };
  }
}
