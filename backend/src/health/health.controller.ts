import { Controller, Get, Res } from "@nestjs/common";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import type { Response } from "express";

import { Public } from "../auth/decorators/public.decorator";
import { smtpConfigured } from "../admin/mailer";
import { ffmpegAvailable } from "../media/ffmpeg";
import { mediaRoot } from "../media/media.paths";
import { PrismaService } from "../prisma/prisma.service";

@Public()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    let media = false;
    try {
      await access(mediaRoot(), constants.R_OK | constants.W_OK);
      media = true;
    } catch {
      media = false;
    }

    const ffmpeg = await ffmpegAvailable();
    const ok = db && media;
    if (!ok) res.status(503);
    return {
      ok,
      service: "anemi",
      db,
      media,
      ffmpeg,
      smtp: smtpConfigured()
    };
  }
}
