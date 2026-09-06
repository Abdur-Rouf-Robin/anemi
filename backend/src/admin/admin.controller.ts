import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { PublishStatus, Role } from "@prisma/client";
import { diskStorage, memoryStorage } from "multer";

import { PACK_FILE_COUNT, VIDEO_FILE_BYTES } from "../media/media-limits";
import { episodeDir, packDir } from "../media/media.paths";
import { ImportInboxDto } from "./dto/import-inbox.dto";

import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { StaffMfaGuard } from "../auth/guards/staff-mfa.guard";
import { CreateInviteDto } from "./dto/create-invite.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { SetRequestStatusDto } from "./dto/set-request-status.dto";
import { SetRoleDto } from "./dto/set-role.dto";
import { SendNewsletterDto } from "./dto/send-newsletter.dto";
import { SiteSettingDto } from "./dto/site-setting.dto";
import { UpsertEpisodeDto } from "./dto/upsert-episode.dto";
import { UpsertGenreDto } from "./dto/upsert-genre.dto";
import { UpsertTitleDto } from "./dto/upsert-title.dto";
import { AdminService } from "./admin.service";

@Controller("admin")
@Roles(Role.ADMIN, Role.MODERATOR)
@UseGuards(StaffMfaGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("overview")
  overview() {
    return this.admin.overview();
  }

  @Roles(Role.ADMIN)
  @Get("users")
  users() {
    return this.admin.users();
  }

  @Roles(Role.ADMIN)
  @Get("audit")
  auditLog() {
    return this.admin.auditLog();
  }

  @Roles(Role.ADMIN)
  @Post("users")
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    const next = await this.admin.createUser(dto);
    await this.admin.audit(user.id, "create", "user", next.id, { role: next.role });
    return next;
  }

  @Roles(Role.ADMIN)
  @Patch("users/:id")
  async setRole(@Param("id") id: string, @Body() dto: SetRoleDto, @CurrentUser() user: AuthUser) {
    const next = await this.admin.setRole(id, dto.role);
    await this.admin.audit(user.id, "set-role", "user", id, { role: dto.role });
    return next;
  }

  @Roles(Role.ADMIN)
  @Get("invites")
  invites() {
    return this.admin.invites();
  }

  @Roles(Role.ADMIN)
  @Post("invites")
  async createInvite(@Body() dto: CreateInviteDto, @CurrentUser() user: AuthUser) {
    const next = await this.admin.createInvite(user.id, dto);
    await this.admin.audit(user.id, "create", "invite", next.id);
    return next;
  }

  @Roles(Role.ADMIN)
  @Delete("invites/:id")
  async revokeInvite(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.revokeInvite(id);
    await this.admin.audit(user.id, "revoke", "invite", id);
    return next;
  }

  @Get("titles")
  titles() {
    return this.admin.titles();
  }

  @Get("titles/:id")
  title(@Param("id") id: string) {
    return this.admin.title(id);
  }

  @Post("titles")
  createTitle(@Body() dto: UpsertTitleDto) {
    return this.admin.createTitle(dto);
  }

  @Patch("titles/:id")
  updateTitle(@Param("id") id: string, @Body() dto: UpsertTitleDto) {
    return this.admin.updateTitle(id, dto);
  }

  @Post("titles/:id/publish")
  async publish(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.setPublish(id, PublishStatus.PUBLISHED);
    await this.admin.audit(user.id, "publish", "title", id);
    return next;
  }

  @Post("titles/:id/unlist")
  async unlist(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.setPublish(id, PublishStatus.UNLISTED);
    await this.admin.audit(user.id, "unlist", "title", id);
    return next;
  }

  @Delete("titles/:id")
  async deleteTitle(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.deleteTitle(id);
    await this.admin.audit(user.id, "delete", "title", id);
    return next;
  }

  @Post("titles/:id/seasons")
  addSeason(@Param("id") id: string) {
    return this.admin.addSeason(id);
  }

  @Delete("seasons/:id")
  deleteSeason(@Param("id") id: string) {
    return this.admin.deleteSeason(id);
  }

  @Post("seasons/:id/publish-ready")
  async publishSeasonReady(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.publishSeasonReady(id);
    await this.admin.audit(user.id, "publish-ready", "season", id, { published: next.published });
    return next;
  }

  @Post("titles/:id/episodes")
  addEpisode(@Param("id") id: string, @Body() dto: UpsertEpisodeDto) {
    return this.admin.addEpisode(id, dto);
  }

  @Post("titles/:id/pack")
  @UseInterceptors(
    FilesInterceptor("files", PACK_FILE_COUNT, {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, packDir()),
        filename: (_req, file, cb) => {
          const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
          cb(null, `${Date.now()}-${safe}`);
        }
      }),
      limits: { fileSize: VIDEO_FILE_BYTES }
    })
  )
  uploadPack(
    @Param("id") id: string,
    @Query("seasonId") seasonId: string | undefined,
    @UploadedFiles() files?: { path?: string; mimetype: string; originalname: string }[]
  ) {
    return this.admin.uploadPack(id, seasonId, files ?? []);
  }

  @Get("inbox")
  inbox(@Query("path") path?: string) {
    return this.admin.listInbox(path ?? "");
  }

  @Post("titles/:id/inbox")
  importInbox(@Param("id") id: string, @Body() dto: ImportInboxDto) {
    return this.admin.importInbox(id, dto);
  }

  @Patch("episodes/:id")
  updateEpisode(@Param("id") id: string, @Body() dto: UpsertEpisodeDto) {
    return this.admin.updateEpisode(id, dto);
  }

  @Delete("episodes/:id")
  async deleteEpisode(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.deleteEpisode(id);
    await this.admin.audit(user.id, "delete", "episode", id);
    return next;
  }

  @Get("genres")
  genres() {
    return this.admin.genres();
  }

  @Post("genres")
  createGenre(@Body() dto: UpsertGenreDto) {
    return this.admin.createGenre(dto);
  }

  @Delete("genres/:id")
  deleteGenre(@Param("id") id: string) {
    return this.admin.deleteGenre(id);
  }

  @Get("requests")
  requests() {
    return this.admin.requests();
  }

  @Patch("requests/:id")
  setRequestStatus(@Param("id") id: string, @Body() dto: SetRequestStatusDto) {
    return this.admin.setRequestStatus(id, dto.status);
  }

  @Get("reports")
  reports() {
    return this.admin.reports();
  }

  @Delete("comments/:id")
  async deleteComment(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.deleteComment(id);
    await this.admin.audit(user.id, "delete", "comment", id);
    return next;
  }

  @Get("posts")
  posts() {
    return this.admin.posts();
  }

  @Delete("posts/:id")
  async deletePost(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const next = await this.admin.deletePost(id);
    await this.admin.audit(user.id, "delete", "post", id);
    return next;
  }

  @Roles(Role.ADMIN)
  @Get("newsletter")
  subscribers() {
    return this.admin.subscribers();
  }

  @Roles(Role.ADMIN)
  @Get("newsletter/campaigns")
  campaigns() {
    return this.admin.campaigns();
  }

  @Roles(Role.ADMIN)
  @Post("newsletter/send")
  async sendNewsletter(@Body() dto: SendNewsletterDto, @CurrentUser() user: AuthUser) {
    const next = await this.admin.sendNewsletter(dto);
    await this.admin.audit(user.id, "send", "newsletter", next.id, { subject: dto.subject });
    return next;
  }

  @Get("encodes")
  encodeJobs() {
    return this.admin.encodeJobs();
  }

  @Post("episodes/:id/encode/retry")
  retryEncode(@Param("id") id: string) {
    return this.admin.retryEncode(id);
  }

  @Post("episodes/:id/encode/cancel")
  cancelEncode(@Param("id") id: string) {
    return this.admin.cancelEncode(id);
  }

  @Get("comments")
  comments() {
    return this.admin.comments();
  }

  @Roles(Role.ADMIN)
  @Get("settings")
  settings() {
    return this.admin.settings();
  }

  @Roles(Role.ADMIN)
  @Get("home")
  homepage() {
    return this.admin.homepage();
  }

  @Get("schedule")
  scheduleDesk() {
    return this.admin.scheduleDesk();
  }

  @Roles(Role.ADMIN)
  @Patch("settings")
  updateSettings(@Body() dto: SiteSettingDto) {
    return this.admin.updateSettings(dto);
  }

  @Roles(Role.ADMIN)
  @Get("contact")
  contactMessages() {
    return this.admin.contactMessages();
  }

  @Roles(Role.ADMIN)
  @Delete("contact/:id")
  deleteContact(@Param("id") id: string) {
    return this.admin.deleteContact(id);
  }

  @Post("titles/:id/poster")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }
    })
  )
  uploadPoster(
    @Param("id") id: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    return this.admin.uploadPoster(id, file);
  }

  @Post("titles/:id/backdrop")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }
    })
  )
  uploadBackdrop(
    @Param("id") id: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    return this.admin.uploadBackdrop(id, file);
  }

  @Post("episodes/:id/captions")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }
    })
  )
  uploadCaptions(
    @Param("id") id: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; originalname: string },
    @Query("language") language?: string
  ) {
    return this.admin.uploadCaptions(id, file, language);
  }

  @Delete("captions/:id")
  deleteCaption(@Param("id") id: string) {
    return this.admin.deleteCaption(id);
  }

  @Post("episodes/:id/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, _file, cb) => cb(null, episodeDir(String(req.params.id))),
        filename: (_req, _file, cb) => cb(null, "source.mp4")
      }),
      limits: { fileSize: VIDEO_FILE_BYTES }
    })
  )
  upload(
    @Param("id") id: string,
    @UploadedFile() file?: { path?: string; mimetype: string; originalname: string }
  ) {
    return this.admin.uploadSource(id, file);
  }
}
