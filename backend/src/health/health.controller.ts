import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";

import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { publicHealthView, readHealth } from "./health-status";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const full = await readHealth(this.prisma);
    if (!full.ok) res.status(503);
    return publicHealthView(full);
  }
}
