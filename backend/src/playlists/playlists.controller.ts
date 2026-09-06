import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AddPlaylistItemDto, CreatePlaylistDto, RenamePlaylistDto } from "./dto/playlist.dto";
import { PlaylistsService } from "./playlists.service";

@Controller("playlists")
export class PlaylistsController {
  constructor(private readonly playlists: PlaylistsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.playlists.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePlaylistDto) {
    return this.playlists.create(user.id, dto.name);
  }

  @Public()
  @Get(":id")
  one(@Param("id") id: string, @CurrentUser() user: AuthUser | null) {
    return this.playlists.one(id, user?.id ?? null);
  }

  @Patch(":id")
  rename(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: RenamePlaylistDto) {
    return this.playlists.rename(user.id, id, dto.name);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.playlists.remove(user.id, id);
  }

  @Post(":id/items")
  addItem(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AddPlaylistItemDto) {
    return this.playlists.addItem(user.id, id, dto.titleId);
  }

  @Delete(":id/items/:titleId")
  removeItem(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("titleId") titleId: string) {
    return this.playlists.removeItem(user.id, id, titleId);
  }
}
