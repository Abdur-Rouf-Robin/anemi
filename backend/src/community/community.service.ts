import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { ContactDto, CreatePostDto, CreateRequestDto, NewsletterDto, PreferencesDto } from "./dto/community.dto";
import { mailFrom, mailTransport, smtpConfigured } from "../admin/mailer";

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyFollowers(titleId: string, title: string, body: string, href: string) {
    const follows = await this.prisma.follow.findMany({
      where: { titleId },
      select: { userId: true }
    });
    if (!follows.length) return;
    await this.prisma.notification.createMany({
      data: follows.map((row) => ({
        userId: row.userId,
        kind: "episode",
        title,
        body,
        href
      }))
    });
  }

  notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40
    });
  }

  async markRead(userId: string, id?: string) {
    await this.prisma.notification.updateMany({
      where: { userId, ...(id ? { id } : { read: false }) },
      data: { read: true }
    });
    return { ok: true };
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  createRequest(userId: string | null, dto: CreateRequestDto) {
    return this.prisma.titleRequest.create({
      data: {
        userId: userId ?? undefined,
        name: dto.name.trim(),
        referenceUrl: dto.referenceUrl?.trim() || null,
        details: dto.details?.trim() || null
      }
    });
  }

  requests() {
    return this.prisma.titleRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { user: { select: { displayName: true } } }
    });
  }

  posts(category?: string) {
    return this.prisma.communityPost.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { user: { select: { displayName: true } } }
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        body: row.body,
        createdAt: row.createdAt,
        displayName: row.user.displayName
      }))
    );
  }

  createPost(userId: string, dto: CreatePostDto) {
    return this.prisma.communityPost.create({
      data: { userId, category: dto.category, title: dto.title.trim(), body: dto.body.trim() }
    });
  }

  async subscribe(dto: NewsletterDto) {
    await this.prisma.newsletter.upsert({
      where: { email: dto.email.toLowerCase() },
      update: {},
      create: { email: dto.email.toLowerCase() }
    });
    return { ok: true };
  }

  async contact(dto: ContactDto) {
    const row = await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        body: dto.body.trim()
      }
    });
    const settings = await this.prisma.siteSetting.findUnique({ where: { id: "default" } });
    const to = settings?.contactEmail?.trim() || mailFrom();
    if (smtpConfigured()) {
      const transport = mailTransport();
      if (transport) {
        try {
          await transport.sendMail({
            from: mailFrom(),
            to,
            replyTo: row.email,
            subject: `Anemi contact from ${row.name}`,
            text: `${row.body}\n\n— ${row.name} <${row.email}>`
          });
        } catch {
          /* stored even if mail fails */
        }
      }
    }
    return { ok: true };
  }

  async preferences(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        autoPlay: true,
        autoNext: true,
        autoSkipIntro: true,
        theme: true,
        locale: true
      }
    });
    return user;
  }

  updatePreferences(userId: string, dto: PreferencesDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.autoPlay != null ? { autoPlay: dto.autoPlay } : {}),
        ...(dto.autoNext != null ? { autoNext: dto.autoNext } : {}),
        ...(dto.autoSkipIntro != null ? { autoSkipIntro: dto.autoSkipIntro } : {}),
        ...(dto.theme ? { theme: dto.theme } : {}),
        ...(dto.locale ? { locale: dto.locale } : {})
      },
      select: {
        autoPlay: true,
        autoNext: true,
        autoSkipIntro: true,
        theme: true,
        locale: true
      }
    });
  }
}
