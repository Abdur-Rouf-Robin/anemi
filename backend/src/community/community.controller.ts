import { Body, Controller, Get, Param, Post, Put, Query, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";

import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { SkipCsrf } from "../auth/decorators/skip-csrf.decorator";
import { PublicWriteRateLimitGuard } from "../auth/guards/public-write-rate-limit.guard";
import { StaffMfaGuard } from "../auth/guards/staff-mfa.guard";
import { CommunityService } from "./community.service";
import { CreatePostDto, CreateRequestDto, ContactDto, NewsletterDto, PreferencesDto } from "./dto/community.dto";
import { defaultUserSettings } from "../lib/user-settings";

@Controller()
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get("notifications")
  async notifications(@CurrentUser() user: AuthUser) {
    const [items, unread] = await Promise.all([
      this.community.notifications(user.id),
      this.community.unreadCount(user.id)
    ]);
    return { items, unread };
  }

  @Put("notifications/read")
  markAll(@CurrentUser() user: AuthUser) {
    return this.community.markRead(user.id);
  }

  @Put("notifications/:id/read")
  markOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.community.markRead(user.id, id);
  }

  @Public()
  @SkipCsrf()
  @UseGuards(PublicWriteRateLimitGuard)
  @Post("requests")
  createRequest(@CurrentUser() user: AuthUser | null, @Body() dto: CreateRequestDto) {
    return this.community.createRequest(user?.id ?? null, dto);
  }

  @Roles(Role.ADMIN, Role.MODERATOR)
  @UseGuards(StaffMfaGuard)
  @Get("requests")
  listRequests() {
    return this.community.requests();
  }

  @Public()
  @Get("community/posts")
  posts(@Query("category") category?: string, @Query("take") take?: string) {
    const n = Number(take);
    return this.community.posts(category, Number.isFinite(n) ? n : 40);
  }

  @Post("community/posts")
  createPost(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.community.createPost(user.id, dto);
  }

  @Public()
  @SkipCsrf()
  @UseGuards(PublicWriteRateLimitGuard)
  @Post("newsletter")
  subscribe(@Body() dto: NewsletterDto) {
    return this.community.subscribe(dto);
  }

  @Public()
  @SkipCsrf()
  @UseGuards(PublicWriteRateLimitGuard)
  @Post("contact")
  contact(@Body() dto: ContactDto) {
    return this.community.contact(dto);
  }

  @Get("preferences")
  preferences(@CurrentUser() user: AuthUser) {
    return this.community.preferences(user.id);
  }

  @Public()
  @Get("preferences/me")
  async publicPrefs(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return {
        autoPlay: false,
        autoNext: true,
        autoSkipIntro: false,
        theme: "light",
        locale: "en",
        settings: defaultUserSettings
      };
    }
    return this.community.preferences(user.id);
  }

  @Put("preferences")
  updatePrefs(@CurrentUser() user: AuthUser | null, @Body() dto: PreferencesDto) {
    if (!user) throw new UnauthorizedException();
    return this.community.updatePreferences(user.id, dto);
  }
}
