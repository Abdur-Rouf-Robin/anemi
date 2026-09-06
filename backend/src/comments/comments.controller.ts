import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { StaffMfaGuard } from "../auth/guards/staff-mfa.guard";
import type { AuthUser } from "../auth/auth.types";
import { CommentsService } from "./comments.service";
import { CreateCommentDto, ReportCommentDto } from "./dto/create-comment.dto";

@Controller("comments")
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Public()
  @Get()
  list(@Query("episodeId") episodeId: string, @Query("sort") sort?: "newest" | "oldest" | "top") {
    return this.comments.list(episodeId, sort ?? "newest");
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.comments.create(user.id, dto);
  }

  @Post(":id/report")
  report(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ReportCommentDto) {
    return this.comments.report(user.id, id, dto);
  }

  @UseGuards(StaffMfaGuard)
  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.comments.remove(user, id);
  }
}
