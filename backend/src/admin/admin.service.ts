import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PublishStatus } from "@prisma/client";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CommunityService } from "../community/community.service";
import { EncodeService } from "../media/encode.service";
import { artDir, episodeDir } from "../media/media.paths";
import { PrismaService } from "../prisma/prisma.service";
import { mailFrom, mailTransport, smtpConfigured } from "./mailer";
import type { UpsertEpisodeDto } from "./dto/upsert-episode.dto";
import type { UpsertTitleDto } from "./dto/upsert-title.dto";
import { normalizeHomeConfig } from "../catalog/home-config";

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
      recentRequests
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
      recentTitles,
      recentRequests
    };
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

  encodeJobs() {
    return this.prisma.encodeJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        episode: {
          select: {
            id: true,
            name: true,
            number: true,
            audioKind: true,
            encodeStatus: true,
            season: { select: { number: true, title: { select: { name: true, id: true } } } }
          }
        }
      }
    });
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
    return this.prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" }
    });
  }

  async updateSettings(dto: {
    announcement?: string;
    announcementHref?: string;
    scheduleMailEnabled?: boolean;
    contactEmail?: string;
    communityGuidelines?: string;
    homeConfig?: unknown;
  }) {
    const homeConfig = dto.homeConfig !== undefined ? normalizeHomeConfig(dto.homeConfig) : undefined;
    return this.prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {
        ...(dto.announcement !== undefined ? { announcement: dto.announcement.trim() || null } : {}),
        ...(dto.announcementHref !== undefined ? { announcementHref: dto.announcementHref.trim() || null } : {}),
        ...(dto.scheduleMailEnabled != null ? { scheduleMailEnabled: dto.scheduleMailEnabled } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail?.trim() || null } : {}),
        ...(dto.communityGuidelines !== undefined
          ? { communityGuidelines: dto.communityGuidelines.trim() || null }
          : {}),
        ...(homeConfig ? { homeConfig: homeConfig as Prisma.InputJsonValue } : {})
      },
      create: {
        id: "default",
        announcement: dto.announcement?.trim() || null,
        announcementHref: dto.announcementHref?.trim() || null,
        scheduleMailEnabled: dto.scheduleMailEnabled ?? false,
        contactEmail: dto.contactEmail?.trim() || null,
        communityGuidelines: dto.communityGuidelines?.trim() || null,
        homeConfig: homeConfig ? (homeConfig as Prisma.InputJsonValue) : undefined
      }
    });
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
      data: { role },
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
        videoUrl: dto.videoUrl,
        durationSec: dto.durationSec,
        introStartSec: dto.introStartSec,
        introEndSec: dto.introEndSec,
        audioKind,
        language,
        airDate: dto.airDate ? new Date(dto.airDate) : undefined,
        publish: PublishStatus.PUBLISHED
      }
    });
    await this.community.notifyFollowers(
      titleId,
      title.name,
      `Episode ${number} is up: ${dto.name}`,
      `/watch/${episode.id}`
    );
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

  async deleteEpisode(id: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id } });
    if (!episode) throw new NotFoundException("Episode not found");
    await this.prisma.episode.delete({ where: { id } });
    return { ok: true };
  }

  async updateEpisode(id: string, dto: UpsertEpisodeDto) {
    const episode = await this.prisma.episode.findUnique({ where: { id } });
    if (!episode) throw new NotFoundException("Episode not found");
    try {
      return await this.prisma.episode.update({
        where: { id },
        data: {
          name: dto.name,
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
    file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose a video file");
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException("Episode not found");
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "application/octet-stream"];
    if (!allowed.includes(file.mimetype) && !/\.(mp4|webm|mov|mkv)$/i.test(file.originalname)) {
      throw new BadRequestException("Upload an mp4, webm, or mov file you own or license");
    }
    const dest = join(episodeDir(episodeId), "source.mp4");
    await writeFile(dest, file.buffer);
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { encodeStatus: "queued", encodeError: null }
    });
    await this.encode.enqueue(episodeId);
    return { ok: true, encodeStatus: "queued" };
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
