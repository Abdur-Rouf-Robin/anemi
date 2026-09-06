import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PublishStatus, Role } from "@prisma/client";
import { hash } from "bcrypt";
import { copyFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { join, relative as pathRelative } from "node:path";

import { CommunityService } from "../community/community.service";
import { encodeJobProgress } from "../media/encode-live";
import { EncodeService } from "../media/encode.service";
import { resolveUnderRoot } from "../media/inbox-path";
import { VIDEO_NAME } from "../media/media-limits";
import { artDir, episodeDir, inboxRoot, packDir } from "../media/media.paths";
import type { ImportInboxDto } from "./dto/import-inbox.dto";
import { PrismaService } from "../prisma/prisma.service";
import { mailFrom, mailTransport, smtpConfigured } from "./mailer";
import { episodeReadyToPublish } from "./episode-ready";
import { parseEpisodeFilename } from "./parse-episode-filename";
import type { UpsertEpisodeDto } from "./dto/upsert-episode.dto";
import type { UpsertTitleDto } from "./dto/upsert-title.dto";
import { newInviteCode } from "../auth/reset-token";
import { normalizeSignupMode } from "../auth/signup-mode";
import { normalizeHomeConfig } from "../catalog/home-config";
import { readHealth } from "../health/health-status";
import { formatBytes, readStorage } from "../health/storage-status";
import { publicSiteUrl } from "../lib/public-site-url";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encode: EncodeService,
    private readonly community: CommunityService
  ) {}

  async overview() {
    const [
      published,
      titles,
      episodes,
      users,
      openRequests,
      reports,
      comments,
      posts,
      subscribers,
      recentTitles,
      recentRequests,
      invitesOpen,
      invitesUsed,
      invitesExpired
    ] = await Promise.all([
      this.prisma.title.count({ where: { publish: PublishStatus.PUBLISHED } }),
      this.prisma.title.count(),
      this.prisma.episode.count(),
      this.prisma.user.count(),
      this.prisma.titleRequest.count({ where: { status: "OPEN" } }),
      this.prisma.commentReport.count(),
      this.prisma.comment.count(),
      this.prisma.communityPost.count(),
      this.prisma.newsletter.count(),
      this.prisma.title.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, name: true, publish: true, updatedAt: true }
      }),
      this.prisma.titleRequest.findMany({
        where: { status: { in: ["OPEN", "REVIEWING"] } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, status: true, createdAt: true }
      }),
      this.prisma.invite.count({
        where: { usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }
      }),
      this.prisma.invite.count({ where: { usedAt: { not: null } } }),
      this.prisma.invite.count({
        where: { usedAt: null, revokedAt: null, expiresAt: { lte: new Date() } }
      })
    ]);
    return {
      published,
      titles,
      episodes,
      users,
      openRequests,
      reports,
      comments,
      posts,
      subscribers,
      encoding: await this.prisma.encodeJob.count({ where: { status: { in: ["queued", "encoding"] } } }),
      playable: await this.prisma.episode.count({
        where: { videoUrl: { not: null } }
      }),
      encodeLive: this.encode.snapshot(),
      inboxHasFiles: await this.inboxHasFiles(),
      health: await readHealth(this.prisma),
      storage: await readStorage().then((row) => ({
        ...row,
        mediaLabel: formatBytes(row.mediaBytes),
        backupLabel: formatBytes(row.backupBytes)
      })),
      invitesOpen,
      invitesUsed,
      invitesExpired,
      recentTitles,
      recentRequests
    };
  }

  audit(actorId: string | null, action: string, entity: string, entityId: string, meta?: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entity, entityId, meta: meta ?? undefined }
    });
  }

  auditLog() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 80
    });
  }

  genres() {
    return this.prisma.genre.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { titles: true } } }
    });
  }

  async createGenre(dto: { name: string; slug?: string }) {
    const slug =
      dto.slug?.trim().toLowerCase() ||
      dto.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (!slug) throw new BadRequestException("Genre name is required");
    return this.prisma.genre.create({
      data: { name: dto.name.trim(), slug }
    });
  }

  async deleteGenre(id: string) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) throw new NotFoundException("Genre not found");
    await this.prisma.titleGenre.deleteMany({ where: { genreId: id } });
    await this.prisma.genre.delete({ where: { id } });
    return { ok: true };
  }

  requests() {
    return this.prisma.titleRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { user: { select: { displayName: true, email: true } } }
    });
  }

  async setRequestStatus(id: string, status: "OPEN" | "REVIEWING" | "FULFILLED" | "DECLINED") {
    const row = await this.prisma.titleRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Request not found");
    return this.prisma.titleRequest.update({ where: { id }, data: { status } });
  }

  reports() {
    return this.prisma.commentReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: { select: { displayName: true } },
        comment: {
          select: {
            id: true,
            body: true,
            spoiler: true,
            createdAt: true,
            user: { select: { displayName: true } },
            episode: { select: { id: true, name: true } }
          }
        }
      }
    });
  }

  async deleteComment(id: string) {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Comment not found");
    await this.prisma.comment.delete({ where: { id } });
    return { ok: true };
  }

  posts() {
    return this.prisma.communityPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { user: { select: { displayName: true, email: true } } }
    });
  }

  async deletePost(id: string) {
    const row = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Post not found");
    await this.prisma.communityPost.delete({ where: { id } });
    return { ok: true };
  }

  subscribers() {
    return this.prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } });
  }

  campaigns() {
    return this.prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  }

  async sendNewsletter(dto: { subject: string; body: string }) {
    const campaign = await this.prisma.newsletterCampaign.create({
      data: { subject: dto.subject.trim(), body: dto.body.trim(), status: "draft" }
    });
    const subscribers = await this.prisma.newsletter.findMany({ select: { email: true } });
    if (!subscribers.length) {
      await this.prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: "failed", error: "No subscribers yet." }
      });
      throw new BadRequestException("No subscribers yet.");
    }
    if (!smtpConfigured()) {
      await this.prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "draft",
          error: "SMTP is not configured. Set SMTP_HOST or SMTP_URL, then send again."
        }
      });
      throw new BadRequestException(
        "SMTP is not configured. Set SMTP_HOST (and SMTP_USER / SMTP_PASS) or SMTP_URL in backend/.env."
      );
    }
    const transport = mailTransport();
    if (!transport) {
      throw new BadRequestException("SMTP is not configured.");
    }
    let sentCount = 0;
    try {
      for (const row of subscribers) {
        await transport.sendMail({
          from: mailFrom(),
          to: row.email,
          subject: campaign.subject,
          text: campaign.body
        });
        sentCount += 1;
      }
      return this.prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: "sent", sentCount, sentAt: new Date(), error: null }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      await this.prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: "failed", sentCount, error: message }
      });
      throw new BadRequestException(message);
    }
  }

  async encodeJobs() {
    const live = this.encode.snapshot();
    const jobs = await this.prisma.encodeJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        episode: {
          select: {
            id: true,
            name: true,
            number: true,
            audioKind: true,
            encodeStatus: true,
            publish: true,
            videoUrl: true,
            season: { select: { number: true, title: { select: { name: true, id: true } } } }
          }
        }
      }
    });
    return jobs.map((job) => ({
      ...job,
      progress: encodeJobProgress(job.episode.id, job.status, live)
    }));
  }

  private async inboxHasFiles() {
    try {
      const entries = await readdir(inboxRoot(), { withFileTypes: true });
      return entries.some((entry) => entry.isFile() || entry.isDirectory());
    } catch {
      return false;
    }
  }

  retryEncode(episodeId: string) {
    return this.encode.retry(episodeId);
  }

  cancelEncode(episodeId: string) {
    return this.encode.cancel(episodeId);
  }

  comments() {
    return this.prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: { select: { displayName: true } },
        episode: { select: { id: true, name: true } }
      }
    });
  }

  async settings() {
    const row = await this.prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" }
    });
    return { ...row, smtpConfigured: smtpConfigured() };
  }

  async updateSettings(dto: {
    announcement?: string;
    announcementHref?: string;
    scheduleMailEnabled?: boolean;
    contactEmail?: string;
    communityGuidelines?: string;
    signupMode?: string;
    homeConfig?: unknown;
  }) {
    const homeConfig = dto.homeConfig !== undefined ? normalizeHomeConfig(dto.homeConfig) : undefined;
    const row = await this.prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {
        ...(dto.announcement !== undefined ? { announcement: dto.announcement.trim() || null } : {}),
        ...(dto.announcementHref !== undefined ? { announcementHref: dto.announcementHref.trim() || null } : {}),
        ...(dto.scheduleMailEnabled != null ? { scheduleMailEnabled: dto.scheduleMailEnabled } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail?.trim() || null } : {}),
        ...(dto.communityGuidelines !== undefined
          ? { communityGuidelines: dto.communityGuidelines.trim() || null }
          : {}),
        ...(dto.signupMode ? { signupMode: normalizeSignupMode(dto.signupMode) } : {}),
        ...(homeConfig ? { homeConfig: homeConfig as Prisma.InputJsonValue } : {})
      },
      create: {
        id: "default",
        announcement: dto.announcement?.trim() || null,
        announcementHref: dto.announcementHref?.trim() || null,
        scheduleMailEnabled: dto.scheduleMailEnabled ?? false,
        contactEmail: dto.contactEmail?.trim() || null,
        communityGuidelines: dto.communityGuidelines?.trim() || null,
        signupMode: normalizeSignupMode(dto.signupMode),
        homeConfig: homeConfig ? (homeConfig as Prisma.InputJsonValue) : undefined
      }
    });
    return { ...row, smtpConfigured: smtpConfigured() };
  }

  async homepage() {
    const [settings, titles, genres] = await Promise.all([
      this.settings(),
      this.prisma.title.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
          publish: true,
          spotlight: true,
          year: true
        }
      }),
      this.prisma.genre.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } })
    ]);
    return {
      homeConfig: normalizeHomeConfig(settings.homeConfig),
      communityGuidelines: settings.communityGuidelines,
      announcement: settings.announcement,
      announcementHref: settings.announcementHref,
      titles,
      genres
    };
  }

  async scheduleDesk() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 21);
    const [dated, missing] = await Promise.all([
      this.prisma.episode.findMany({
        where: { airDate: { gte: start, lte: end } },
        orderBy: { airDate: "asc" },
        select: {
          id: true,
          number: true,
          name: true,
          audioKind: true,
          language: true,
          airDate: true,
          publish: true,
          season: { select: { number: true, title: { select: { id: true, name: true, status: true } } } }
        }
      }),
      this.prisma.episode.findMany({
        where: {
          airDate: null,
          publish: PublishStatus.PUBLISHED,
          season: { title: { status: { in: ["AIRING", "UPCOMING"] } } }
        },
        orderBy: [{ season: { title: { name: "asc" } } }, { number: "asc" }],
        take: 40,
        select: {
          id: true,
          number: true,
          name: true,
          audioKind: true,
          language: true,
          airDate: true,
          publish: true,
          season: { select: { number: true, title: { select: { id: true, name: true, status: true } } } }
        }
      })
    ]);
    const days = new Map<string, typeof dated>();
    for (const row of dated) {
      const key = (row.airDate ?? new Date()).toISOString().slice(0, 10);
      const list = days.get(key) ?? [];
      list.push(row);
      days.set(key, list);
    }
    return {
      days: [...days.entries()].map(([date, items]) => ({ date, items })),
      missing
    };
  }

  contactMessages() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
  }

  async deleteContact(id: string) {
    await this.prisma.contactMessage.delete({ where: { id } });
    return { ok: true };
  }

  titles() {
    return this.prisma.title.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { seasons: true } }
      }
    });
  }

  async title(id: string) {
    const row = await this.prisma.title.findUnique({
      where: { id },
      include: {
        genres: { select: { genre: { select: { slug: true, name: true } } } },
        seasons: {
          orderBy: { number: "asc" },
          include: {
            episodes: {
              orderBy: [{ number: "asc" }, { audioKind: "desc" }, { language: "asc" }],
              include: { captions: true }
            }
          }
        }
      }
    });
    if (!row) throw new NotFoundException("Title not found");
    return {
      ...row,
      genres: row.genres.map((item) => item.genre)
    };
  }

  async createTitle(dto: UpsertTitleDto) {
    const title = await this.prisma.title.create({
      data: {
        name: dto.name,
        nameJa: dto.nameJa?.trim() || null,
        slug: dto.slug.trim().toLowerCase(),
        type: dto.type,
        status: dto.status,
        synopsis: dto.synopsis,
        year: dto.year,
        hue: dto.hue ?? 40,
        spotlight: dto.spotlight ?? false,
        studio: dto.studio,
        ageRating: dto.ageRating,
        airSeason: dto.airSeason,
        posterUrl: dto.posterUrl,
        backdropUrl: dto.backdropUrl,
        publish: PublishStatus.DRAFT,
        seasons: { create: { number: 1 } }
      }
    });
    if (dto.genreSlugs?.length) await this.replaceGenres(title.id, dto.genreSlugs);
    return title;
  }

  async updateTitle(id: string, dto: UpsertTitleDto) {
    await this.requireTitle(id);
    const title = await this.prisma.title.update({
      where: { id },
      data: {
        name: dto.name,
        nameJa: dto.nameJa?.trim() || null,
        slug: dto.slug.trim().toLowerCase(),
        type: dto.type,
        status: dto.status,
        synopsis: dto.synopsis,
        year: dto.year,
        hue: dto.hue ?? 40,
        spotlight: dto.spotlight ?? false,
        studio: dto.studio,
        ageRating: dto.ageRating,
        airSeason: dto.airSeason,
        posterUrl: dto.posterUrl,
        backdropUrl: dto.backdropUrl
      }
    });
    if (dto.genreSlugs) await this.replaceGenres(id, dto.genreSlugs);
    return title;
  }

  async deleteTitle(id: string) {
    await this.requireTitle(id);
    await this.prisma.title.delete({ where: { id } });
    return { ok: true };
  }

  async createUser(dto: {
    email: string;
    displayName: string;
    password: string;
    role?: "VIEWER" | "MEMBER" | "MODERATOR" | "ADMIN";
  }) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("An account with that email already exists");
    return this.prisma.user.create({
      data: {
        email,
        displayName: dto.displayName.trim(),
        passwordHash: await hash(dto.password, 12),
        role: dto.role ?? Role.MEMBER
      },
      select: { id: true, email: true, displayName: true, role: true, mfaEnabled: true, createdAt: true }
    });
  }

  invites() {
    return this.prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      take: 80
    });
  }

  async createInvite(actorId: string, dto: { email?: string; note?: string; days?: number }) {
    const days = dto.days ?? 14;
    const code = newInviteCode();
    const row = await this.prisma.invite.create({
      data: {
        code,
        email: dto.email?.trim().toLowerCase() || null,
        note: dto.note?.trim() || null,
        createdBy: actorId,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }
    });
    return {
      ...row,
      url: `${publicSiteUrl()}/account?mode=signup&invite=${row.code}`
    };
  }

  async revokeInvite(id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException("Invite not found");
    if (invite.usedAt) throw new BadRequestException("That invite was already used");
    return this.prisma.invite.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        mfaEnabled: true,
        createdAt: true
      }
    });
  }

  async setRole(id: string, role: "VIEWER" | "MEMBER" | "MODERATOR" | "ADMIN") {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({
      where: { id },
      data: { role, tokenVersion: { increment: 1 } },
      select: { id: true, email: true, displayName: true, role: true }
    });
  }

  async setPublish(id: string, publish: PublishStatus) {
    const title = await this.requireTitle(id);
    const next = await this.prisma.title.update({
      where: { id },
      data: { publish }
    });
    if (publish === PublishStatus.PUBLISHED) {
      await this.community.notifyFollowers(id, title.name, `${title.name} is now on Anemi.`, `/title/${title.slug}`);
    }
    return next;
  }

  async addEpisode(titleId: string, dto: UpsertEpisodeDto) {
    const title = await this.prisma.title.findUnique({
      where: { id: titleId },
      include: { seasons: { orderBy: { number: "asc" } } }
    });
    if (!title) throw new NotFoundException("Title not found");
    let season = dto.seasonId
      ? title.seasons.find((row) => row.id === dto.seasonId)
      : title.seasons[0];
    if (dto.seasonId && !season) throw new BadRequestException("Season not found");
    if (!season) {
      season = await this.prisma.season.create({
        data: { titleId, number: 1 }
      });
    }
    const audioKind = dto.audioKind ?? "SUB";
    const language = (dto.language ?? "").trim();
    const last = await this.prisma.episode.findFirst({
      where: { seasonId: season.id, audioKind, language },
      orderBy: { number: "desc" }
    });
    let number = dto.number ?? (last?.number ?? 0) + 1;
    const taken = await this.prisma.episode.findUnique({
      where: {
        seasonId_number_audioKind_language: { seasonId: season.id, number, audioKind, language }
      }
    });
    if (taken) {
      if (dto.number) {
        throw new ConflictException(
          `Season ${season.number} already has episode ${number} (${audioKind}${language ? ` · ${language}` : ""}). Use a different language, or leave Number blank.`
        );
      }
      number = (last?.number ?? 0) + 1;
      while (
        await this.prisma.episode.findUnique({
          where: {
            seasonId_number_audioKind_language: { seasonId: season.id, number, audioKind, language }
          }
        })
      ) {
        number += 1;
      }
    }
    const langSlug = language.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const episode = await this.prisma.episode.create({
      data: {
        seasonId: season.id,
        number,
        slug: `${title.slug}-s${season.number}e${number}${audioKind === "DUB" ? "-dub" : ""}${langSlug && langSlug !== "original" ? `-${langSlug}` : ""}`,
        name: dto.name,
        kind: dto.kind ?? "CANON",
        videoUrl: dto.videoUrl,
        durationSec: dto.durationSec,
        introStartSec: dto.introStartSec,
        introEndSec: dto.introEndSec,
        audioKind,
        language,
        airDate: dto.airDate ? new Date(dto.airDate) : undefined,
        publish: dto.publish ?? PublishStatus.DRAFT
      }
    });
    return episode;
  }

  async addSeason(titleId: string) {
    await this.requireTitle(titleId);
    const last = await this.prisma.season.findFirst({
      where: { titleId },
      orderBy: { number: "desc" }
    });
    return this.prisma.season.create({
      data: { titleId, number: (last?.number ?? 0) + 1 }
    });
  }

  async deleteSeason(id: string) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) throw new NotFoundException("Season not found");
    await this.prisma.season.delete({ where: { id } });
    return { ok: true };
  }

  async publishSeasonReady(seasonId: string) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { title: { select: { id: true, name: true, slug: true } }, episodes: true }
    });
    if (!season) throw new NotFoundException("Season not found");
    const ready = season.episodes.filter((episode) => episodeReadyToPublish(episode));
    if (!ready.length) {
      throw new BadRequestException("No ready drafts. Upload a file and wait for encode (or paste a video URL).");
    }
    await this.prisma.episode.updateMany({
      where: { id: { in: ready.map((episode) => episode.id) } },
      data: { publish: PublishStatus.PUBLISHED }
    });
    const first = ready[0];
    const href = ready.length === 1 ? `/watch/${first.id}` : `/title/${season.title.slug}`;
    const body =
      ready.length === 1
        ? `Episode ${first.number} is up: ${first.name}`
        : `Season ${season.number}: ${ready.length} new episodes are on Anemi.`;
    await this.community.notifyFollowers(season.title.id, season.title.name, body, href);
    return {
      seasonId: season.id,
      published: ready.length,
      skipped: season.episodes.length - ready.length
    };
  }

  async deleteEpisode(id: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id } });
    if (!episode) throw new NotFoundException("Episode not found");
    await this.prisma.episode.delete({ where: { id } });
    return { ok: true };
  }

  async updateEpisode(id: string, dto: UpsertEpisodeDto) {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: { season: { include: { title: { select: { id: true, name: true } } } } }
    });
    if (!episode) throw new NotFoundException("Episode not found");
    try {
      const next = await this.prisma.episode.update({
        where: { id },
        data: {
          name: dto.name,
          ...(dto.kind ? { kind: dto.kind } : {}),
          ...(dto.number ? { number: dto.number } : {}),
          videoUrl: dto.videoUrl,
          durationSec: dto.durationSec,
          introStartSec: dto.introStartSec,
          introEndSec: dto.introEndSec,
          ...(dto.audioKind ? { audioKind: dto.audioKind } : {}),
          ...(dto.language !== undefined ? { language: dto.language.trim() } : {}),
          ...(dto.airDate !== undefined
            ? { airDate: dto.airDate ? new Date(dto.airDate) : null }
            : {}),
          ...(dto.publish ? { publish: dto.publish } : {}),
          ...(dto.outroStartSec != null ? { outroStartSec: dto.outroStartSec } : {}),
          ...(dto.subtitleUrl !== undefined ? { subtitleUrl: dto.subtitleUrl || null } : {})
        }
      });
      if (
        dto.publish === PublishStatus.PUBLISHED &&
        episode.publish !== PublishStatus.PUBLISHED
      ) {
        await this.community.notifyFollowers(
          episode.season.title.id,
          episode.season.title.name,
          `Episode ${episode.number} is up: ${next.name}`,
          `/watch/${next.id}`
        );
      }
      return next;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("That episode number already has this Sub/Dub language. Pick another language.");
      }
      throw err;
    }
  }

  async uploadPoster(
    titleId: string,
    file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose an image");
    await this.requireTitle(titleId);
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype) && !/\.(jpe?g|png|webp)$/i.test(file.originalname)) {
      throw new BadRequestException("Upload a jpg, png, or webp poster");
    }
    const ext = file.mimetype.includes("png") ? "png" : file.mimetype.includes("webp") ? "webp" : "jpg";
    const name = `${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}.${ext}`;
    const dest = join(artDir(), name);
    await writeFile(dest, file.buffer);
    const url = `/media/art/${name}`;
    return this.prisma.title.update({
      where: { id: titleId },
      data: { posterUrl: url }
    });
  }

  async uploadBackdrop(
    titleId: string,
    file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose an image");
    await this.requireTitle(titleId);
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype) && !/\.(jpe?g|png|webp)$/i.test(file.originalname)) {
      throw new BadRequestException("Upload a jpg, png, or webp backdrop");
    }
    const ext = file.mimetype.includes("png") ? "png" : file.mimetype.includes("webp") ? "webp" : "jpg";
    const name = `${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}-backdrop.${ext}`;
    const dest = join(artDir(), name);
    await writeFile(dest, file.buffer);
    const url = `/media/art/${name}`;
    return this.prisma.title.update({
      where: { id: titleId },
      data: { backdropUrl: url }
    });
  }

  async uploadCaptions(
    episodeId: string,
    file?: { buffer: Buffer; mimetype: string; originalname: string },
    language?: string
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose a .vtt captions file");
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException("Episode not found");
    if (!/\.vtt$/i.test(file.originalname) && file.mimetype !== "text/vtt") {
      throw new BadRequestException("Upload a WebVTT (.vtt) file");
    }
    const label = (language || episode.language || "Captions").trim().slice(0, 40) || "Captions";
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "captions";
    const dest = join(episodeDir(episodeId), `captions-${slug}.vtt`);
    await writeFile(dest, file.buffer);
    const url = `/media/${episodeId}/captions-${slug}.vtt`;
    await this.prisma.captionTrack.upsert({
      where: { episodeId_language: { episodeId, language: label } },
      update: { url },
      create: { episodeId, language: label, url }
    });
    return this.prisma.episode.update({
      where: { id: episodeId },
      data: { subtitleUrl: episode.subtitleUrl || url },
      include: { captions: true }
    });
  }

  async deleteCaption(id: string) {
    const track = await this.prisma.captionTrack.findUnique({ where: { id } });
    if (!track) throw new NotFoundException("Caption track not found");
    await this.prisma.captionTrack.delete({ where: { id } });
    const episode = await this.prisma.episode.findUnique({
      where: { id: track.episodeId },
      include: { captions: true }
    });
    if (episode?.subtitleUrl === track.url) {
      await this.prisma.episode.update({
        where: { id: episode.id },
        data: { subtitleUrl: episode.captions[0]?.url ?? null }
      });
    }
    return { ok: true };
  }

  async uploadSource(
    episodeId: string,
    file?: { path?: string; buffer?: Buffer; mimetype: string; originalname: string }
  ) {
    if (!file) throw new BadRequestException("Choose a video file");
    const onDisk = Boolean(file.path);
    if (!onDisk && !file.buffer?.length) throw new BadRequestException("Choose a video file");
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException("Episode not found");
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "application/octet-stream"];
    if (!allowed.includes(file.mimetype) && !/\.(mp4|webm|mov|mkv)$/i.test(file.originalname)) {
      throw new BadRequestException("Upload an mp4, webm, or mov file you own or license");
    }
    const dest = join(episodeDir(episodeId), "source.mp4");
    if (onDisk && file.path && file.path !== dest) await copyFile(file.path, dest);
    if (!onDisk && file.buffer) await writeFile(dest, file.buffer);
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { encodeStatus: "queued", encodeError: null }
    });
    await this.encode.enqueue(episodeId);
    return { ok: true, encodeStatus: "queued" };
  }

  async uploadPack(
    titleId: string,
    seasonId: string | undefined,
    files: { path?: string; mimetype: string; originalname: string }[]
  ) {
    if (!files?.length) throw new BadRequestException("Choose one or more video files");
    const title = await this.prisma.title.findUnique({
      where: { id: titleId },
      include: { seasons: { orderBy: { number: "asc" } } }
    });
    if (!title) throw new NotFoundException("Title not found");
    const season = seasonId ? title.seasons.find((row) => row.id === seasonId) : title.seasons[0];
    if (!season) throw new BadRequestException("Add a season first");
    const results: { name: string; episodeId?: string; number?: number; status: string; reason?: string }[] = [];
    for (const file of files) {
      const parsed = parseEpisodeFilename(file.originalname);
      if (!parsed) {
        results.push({ name: file.originalname, status: "skipped", reason: "Could not read episode number from the filename" });
        continue;
      }
      try {
        const existing = await this.prisma.episode.findUnique({
          where: {
            seasonId_number_audioKind_language: {
              seasonId: season.id,
              number: parsed.number,
              audioKind: parsed.audioKind,
              language: ""
            }
          }
        });
        const episode =
          existing ??
          (await this.addEpisode(titleId, {
            seasonId: season.id,
            number: parsed.number,
            name: `Episode ${parsed.number}`,
            audioKind: parsed.audioKind,
            publish: "DRAFT"
          }));
        await this.uploadSource(episode.id, file);
        results.push({
          name: file.originalname,
          episodeId: episode.id,
          number: parsed.number,
          status: existing ? "updated" : "created"
        });
      } catch (error) {
        results.push({
          name: file.originalname,
          status: "skipped",
          reason: error instanceof Error ? error.message : "Upload failed"
        });
      } finally {
        if (file.path?.startsWith(packDir())) await unlink(file.path).catch(() => undefined);
      }
    }
    return {
      seasonId: season.id,
      queued: results.filter((row) => row.status === "created" || row.status === "updated").length,
      created: results.filter((row) => row.status === "created").length,
      updated: results.filter((row) => row.status === "updated").length,
      skipped: results.filter((row) => row.status === "skipped").length,
      results
    };
  }

  async listInbox(relative = "") {
    const dir = resolveUnderRoot(inboxRoot(), relative);
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      throw new BadRequestException("Inbox folder not found");
    }
    const folders: { name: string; path: string }[] = [];
    const files: { name: string; path: string; bytes: number }[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const child = join(dir, entry.name);
      const path = pathRelative(inboxRoot(), child).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        folders.push({ name: entry.name, path });
        continue;
      }
      if (!entry.isFile() || !VIDEO_NAME.test(entry.name)) continue;
      const info = await stat(child).catch(() => null);
      files.push({ name: entry.name, path, bytes: info?.size ?? 0 });
    }
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    return {
      root: inboxRoot(),
      path: pathRelative(inboxRoot(), dir).replace(/\\/g, "/"),
      folders,
      files
    };
  }

  async importInbox(titleId: string, dto: ImportInboxDto) {
    const dir = resolveUnderRoot(inboxRoot(), dto.path);
    const info = await stat(dir).catch(() => null);
    if (!info?.isDirectory()) throw new BadRequestException("Choose a folder inside the inbox");
    const files = (await readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && VIDEO_NAME.test(entry.name))
      .map((entry) => ({
        path: join(dir, entry.name),
        originalname: entry.name,
        mimetype: "application/octet-stream"
      }));
    if (!files.length) throw new BadRequestException("No video files in that folder");
    const result = await this.uploadPack(titleId, dto.seasonId, files);
    return result;
  }

  private async requireTitle(id: string) {
    const title = await this.prisma.title.findUnique({ where: { id } });
    if (!title) throw new NotFoundException("Title not found");
    return title;
  }

  private async replaceGenres(titleId: string, slugs: string[]) {
    await this.prisma.titleGenre.deleteMany({ where: { titleId } });
    for (const slug of slugs) {
      const genre = await this.prisma.genre.findUnique({ where: { slug } });
      if (!genre) continue;
      await this.prisma.titleGenre.create({ data: { titleId, genreId: genre.id } });
    }
  }
}
