import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PublishStatus, Role } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateCommentDto, ReportCommentDto } from "./dto/create-comment.dto";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(episodeId: string, sort: "newest" | "oldest" | "top" = "newest") {
    if (!episodeId) throw new NotFoundException("Episode not found");
    const episode = await this.prisma.episode.findFirst({
      where: { id: episodeId, publish: PublishStatus.PUBLISHED }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    const rows = await this.prisma.comment.findMany({
      where: { episodeId, parentId: null },
      orderBy: sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        body: true,
        spoiler: true,
        createdAt: true,
        userId: true,
        user: { select: { displayName: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          take: 20,
          select: {
            id: true,
            body: true,
            spoiler: true,
            createdAt: true,
            userId: true,
            user: { select: { displayName: true } }
          }
        }
      }
    });
    const items =
      sort === "top"
        ? [...rows].sort((a, b) => (b.replies?.length ?? 0) - (a.replies?.length ?? 0) || b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50)
        : rows.slice(0, 50);
    return {
      items: items.map((row) => this.map(row))
    };
  }

  async create(userId: string, dto: CreateCommentDto) {
    const episode = await this.prisma.episode.findFirst({
      where: { id: dto.episodeId, publish: PublishStatus.PUBLISHED }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, episodeId: dto.episodeId }
      });
      if (!parent) throw new NotFoundException("Parent comment not found");
    }
    const row = await this.prisma.comment.create({
      data: {
        userId,
        episodeId: dto.episodeId,
        body: dto.body.trim(),
        spoiler: Boolean(dto.spoiler),
        parentId: dto.parentId
      },
      include: { user: { select: { displayName: true } } }
    });
    return this.map(row);
  }

  async report(userId: string, id: string, dto: ReportCommentDto) {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Comment not found");
    await this.prisma.commentReport.upsert({
      where: { commentId_userId: { commentId: id, userId } },
      update: { reason: dto.reason },
      create: { commentId: id, userId, reason: dto.reason }
    });
    return { ok: true };
  }

  async remove(user: { id: string; role: Role }, id: string) {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Comment not found");
    if (row.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
      throw new ForbiddenException();
    }
    await this.prisma.comment.delete({ where: { id } });
    return { ok: true };
  }

  private map(row: {
    id: string;
    body: string;
    spoiler?: boolean;
    createdAt: Date;
    userId: string;
    user: { displayName: string };
    replies?: {
      id: string;
      body: string;
      spoiler: boolean;
      createdAt: Date;
      userId: string;
      user: { displayName: string };
    }[];
  }) {
    return {
      id: row.id,
      body: row.body,
      spoiler: Boolean(row.spoiler),
      createdAt: row.createdAt,
      userId: row.userId,
      displayName: row.user.displayName,
      replies: (row.replies ?? []).map((item) => ({
        id: item.id,
        body: item.body,
        spoiler: item.spoiler,
        createdAt: item.createdAt,
        userId: item.userId,
        displayName: item.user.displayName
      }))
    };
  }
}
