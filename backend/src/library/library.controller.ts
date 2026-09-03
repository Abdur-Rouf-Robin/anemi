import { Body, Controller, Delete, Get, Param, Put } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { ImportAniListDto, ImportListDto, ListStatusDto } from "./dto/list-status.dto";
import { ProgressDto } from "./dto/progress.dto";
import { LibraryService } from "./library.service";

@Controller("library")
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  summary(@CurrentUser() user: AuthUser) {
    return this.library.summary(user.id);
  }

  @Get("export")
  exportList(@CurrentUser() user: AuthUser) {
    return this.library.exportList(user.id);
  }

  @Put("import")
  importList(@CurrentUser() user: AuthUser, @Body() dto: ImportListDto) {
    return this.library.importList(user.id, dto);
  }

  @Put("import/anilist")
  importAniList(@CurrentUser() user: AuthUser, @Body() dto: ImportAniListDto) {
    return this.library.importAniList(user.id, dto);
  }

  @Get("flags/:titleId")
  flags(@CurrentUser() user: AuthUser, @Param("titleId") titleId: string) {
    return this.library.flags(user.id, titleId);
  }

  @Get("progress/:episodeId")
  progress(@CurrentUser() user: AuthUser, @Param("episodeId") episodeId: string) {
    return this.library.progressFor(user.id, episodeId);
  }

  @Put("progress")
  saveProgress(@CurrentUser() user: AuthUser, @Body() dto: ProgressDto) {
    return this.library.saveProgress(user.id, dto);
  }

  @Put("later/:titleId")
  later(@CurrentUser() user: AuthUser, @Param("titleId") titleId: string) {
    return this.library.toggleLater(user.id, titleId);
  }

  @Put("follow/:titleId")
  follow(@CurrentUser() user: AuthUser, @Param("titleId") titleId: string) {
    return this.library.toggleFollow(user.id, titleId);
  }

  @Put("list/:titleId")
  setList(@CurrentUser() user: AuthUser, @Param("titleId") titleId: string, @Body() dto: ListStatusDto) {
    return this.library.setList(user.id, titleId, dto);
  }

  @Delete("list/:titleId")
  clearList(@CurrentUser() user: AuthUser, @Param("titleId") titleId: string) {
    return this.library.clearList(user.id, titleId);
  }
}
