import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { IsBoolean, IsInt, IsString, MaxLength, Min, MinLength } from "class-validator";

import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { TogetherService } from "./together.service";

class CreateRoomDto {
  @IsString()
  episodeId!: string;
}

class SyncRoomDto {
  @IsInt()
  @Min(0)
  positionSec!: number;

  @IsBoolean()
  playing!: boolean;
}

class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  body!: string;
}

@Controller("together")
export class TogetherController {
  constructor(private readonly together: TogetherService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    return this.together.create(user.id, dto.episodeId);
  }

  @Public()
  @Get(":code")
  get(@Param("code") code: string) {
    return this.together.get(code);
  }

  @Put(":code/sync")
  sync(@CurrentUser() user: AuthUser, @Param("code") code: string, @Body() dto: SyncRoomDto) {
    return this.together.sync(user.id, code, dto.positionSec, dto.playing);
  }

  @Post(":code/chat")
  chat(@CurrentUser() user: AuthUser, @Param("code") code: string, @Body() dto: ChatDto) {
    return this.together.chat(user.id, code, dto.body);
  }
}
