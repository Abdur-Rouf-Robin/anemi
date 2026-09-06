import { Body, Controller, Get, Header, HttpCode, Param, Post, Put, Query, Res, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";

import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { SkipCsrf } from "../auth/decorators/skip-csrf.decorator";
import { CatalogService } from "./catalog.service";
import { QueryTitlesDto } from "./dto/query-titles.dto";
import { RateTitleDto } from "./dto/rate-title.dto";

@Public()
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("home")
  home() {
    return this.catalog.home();
  }

  @Get("discover")
  discover() {
    return this.catalog.discover();
  }

  @Get("genres")
  genres() {
    return this.catalog.genres();
  }

  @Get("announcement")
  announcement() {
    return this.catalog.announcement();
  }

  @Get("random")
  random() {
    return this.catalog.random();
  }

  @Get("az")
  az(@Query("letter") letter?: string) {
    return this.catalog.az(letter);
  }

  @Get("latest")
  latest(@Query("audio") audio?: "SUB" | "DUB", @Query("take") take?: string) {
    const n = Number(take);
    const size = Number.isFinite(n) ? Math.min(48, Math.max(1, n)) : 24;
    return this.catalog.latest(audio, size);
  }

  @Get("feed/latest.xml")
  @Header("Cache-Control", "public, max-age=300")
  async latestFeed(@Res() res: Response) {
    res.type("application/rss+xml; charset=utf-8").send(await this.catalog.latestRss());
  }

  @Get("feed/schedule.ics")
  @Header("Cache-Control", "public, max-age=300")
  async scheduleFeed(@Res() res: Response) {
    res.type("text/calendar; charset=utf-8").send(await this.catalog.scheduleIcs());
  }

  @Get("schedule")
  schedule() {
    return this.catalog.schedule();
  }

  @Get("charts")
  charts() {
    return this.catalog.charts();
  }

  @Get("studios")
  studios() {
    return this.catalog.studios();
  }

  @Get("studios/:slug")
  studio(@Param("slug") slug: string) {
    return this.catalog.studio(slug);
  }

  @Get("collections/:slug")
  collection(@Param("slug") slug: string) {
    return this.catalog.collection(slug);
  }

  @Get("titles")
  titles(@Query() query: QueryTitlesDto) {
    return this.catalog.titles(query);
  }

  @Get("titles/:slug/related")
  related(@Param("slug") slug: string) {
    return this.catalog.related(slug);
  }

  @Get("titles/:slug/rating")
  rating(@Param("slug") slug: string, @CurrentUser() user: AuthUser | null) {
    return this.catalog.myRating(user?.id ?? null, slug);
  }

  @Put("titles/:slug/rating")
  rate(
    @Param("slug") slug: string,
    @CurrentUser() user: AuthUser | null,
    @Body() dto: RateTitleDto
  ) {
    if (!user) throw new UnauthorizedException("Sign in to vote");
    return this.catalog.rate(user.id, slug, dto.score);
  }

  @Get("titles/:slug")
  title(@Param("slug") slug: string) {
    return this.catalog.titleBySlug(slug);
  }

  @Get("episodes/:id")
  episode(@Param("id") id: string) {
    return this.catalog.episode(id);
  }

  @SkipCsrf()
  @Post("episodes/:id/view")
  @HttpCode(204)
  recordView(@Param("id") id: string) {
    return this.catalog.recordView(id);
  }
}
