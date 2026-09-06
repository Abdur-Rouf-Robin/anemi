import { access } from "node:fs/promises";
import { constants } from "node:fs";

import { smtpConfigured } from "../admin/mailer";
import { ffmpegAvailable } from "../media/ffmpeg";
import { inboxRoot, mediaRoot } from "../media/media.paths";
import type { PrismaService } from "../prisma/prisma.service";

export async function readHealth(prisma: PrismaService) {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
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

  let inbox = false;
  try {
    await access(inboxRoot(), constants.R_OK | constants.W_OK);
    inbox = true;
  } catch {
    inbox = false;
  }

  const ffmpeg = await ffmpegAvailable();
  const smtp = smtpConfigured();
  return {
    ok: db && media,
    service: "anemi" as const,
    db,
    media,
    inbox,
    ffmpeg,
    smtp
  };
}

export function publicHealthView(full: Awaited<ReturnType<typeof readHealth>>) {
  return { ok: full.ok, service: full.service };
}
