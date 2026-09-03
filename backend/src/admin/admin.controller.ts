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
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PublishStatus, Role } from "@prisma/client";
import { memoryStorage } from "multer";

import { Roles } from "../auth/decorators/roles.decorator";
import { StaffMfaGuard } from "../auth/guards/staff-mfa.guard";
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

  @Get("users")
  users() {
    return this.admin.users();
  }

  @Roles(Role.ADMIN)
  @Patch("users/:id")
  setRole(@Param("id") id: string, @Body() dto: SetRoleDto) {
    return this.admin.setRole(id, dto.role);
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
  publish(@Param("id") id: string) {
    return this.admin.setPublish(id, PublishStatus.PUBLISHED);
  }

  @Post("titles/:id/unlist")
  unlist(@Param("id") id: string) {
    return this.admin.setPublish(id, PublishStatus.UNLISTED);
  }

  @Delete("titles/:id")
  deleteTitle(@Param("id") id: string) {
    return this.admin.deleteTitle(id);
  }

  @Post("titles/:id/seasons")
  addSeason(@Param("id") id: string) {
    return this.admin.addSeason(id);
  }

  @Delete("seasons/:id")
  deleteSeason(@Param("id") id: string) {
    return this.admin.deleteSeason(id);
  }

  @Post("titles/:id/episodes")
  addEpisode(@Param("id") id: string, @Body() dto: UpsertEpisodeDto) {
    return this.admin.addEpisode(id, dto);
  }

  @Patch("episodes/:id")
  updateEpisode(@Param("id") id: string, @Body() dto: UpsertEpisodeDto) {
    return this.admin.updateEpisode(id, dto);
  }

  @Delete("episodes/:id")
  deleteEpisode(@Param("id") id: string) {
    return this.admin.deleteEpisode(id);
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
  deleteComment(@Param("id") id: string) {
    return this.admin.deleteComment(id);
  }

  @Get("posts")
  posts() {
    return this.admin.posts();
  }

  @Delete("posts/:id")
  deletePost(@Param("id") id: string) {
    return this.admin.deletePost(id);
  }

  @Get("newsletter")
  subscribers() {
    return this.admin.subscribers();
  }

  @Get("newsletter/campaigns")
  campaigns() {
    return this.admin.campaigns();
  }

  @Post("newsletter/send")
  sendNewsletter(@Body() dto: SendNewsletterDto) {
    return this.admin.sendNewsletter(dto);
  }

  @Get("encodes")
  encodeJobs() {
    return this.admin.encodeJobs();
  }

  @Get("comments")
  comments() {
    return this.admin.comments();
  }

  @Get("settings")
  settings() {
    return this.admin.settings();
  }

  @Get("home")
  homepage() {
    return this.admin.homepage();
  }

  @Get("schedule")
  scheduleDesk() {
    return this.admin.scheduleDesk();
  }

  @Patch("settings")
  updateSettings(@Body() dto: SiteSettingDto) {
    return this.admin.updateSettings(dto);
  }

  @Get("contact")
  contactMessages() {
    return this.admin.contactMessages();
  }

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
      storage: memoryStorage(),
      limits: { fileSize: 400 * 1024 * 1024 }
    })
  )
  upload(
    @Param("id") id: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    return this.admin.uploadSource(id, file);
  }
}
