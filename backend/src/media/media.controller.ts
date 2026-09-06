import { Controller, Get, NotFoundException, Param, Req, Res } from "@nestjs/common";
import { PublishStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import type { AuthUser } from "../auth/auth.types";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { accelRedirect, shouldAccelMedia } from "./media-accel";
import { canReadEpisodeMedia } from "./media-access";
import { artDir, episodeDir, mediaRoot } from "./media.paths";

const TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function sendFile(path: string, req: Request, res: Response, cache: string) {
  const type = TYPES[extname(path)] ?? "application/octet-stream";
  if (shouldAccelMedia(req)) {
    const root = mediaRoot();
    const relative = path.startsWith(root) ? path.slice(root.length).replace(/^\/+/, "") : "";
    if (relative) {
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", cache);
      res.setHeader("X-Accel-Redirect", accelRedirect(relative));
      res.end();
      return;
    }
  }
  const stat = statSync(path);
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", cache);
  res.setHeader("Accept-Ranges", "bytes");

  const range = req.headers.range;
  if (!range || !range.startsWith("bytes=")) {
    res.setHeader("Content-Length", String(stat.size));
    createReadStream(path).pipe(res);
    return;
  }

  const [rawStart, rawEnd] = range.replace("bytes=", "").split("-");
  const start = rawStart ? Number(rawStart) : 0;
  const end = rawEnd ? Number(rawEnd) : stat.size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= stat.size) {
    res.status(416);
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    res.end();
    return;
  }

  const last = Math.min(end, stat.size - 1);
  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${last}/${stat.size}`);
  res.setHeader("Content-Length", String(last - start + 1));
  createReadStream(path, { start, end: last }).pipe(res);
}

@Public()
@Controller("media")
export class MediaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("art/:file")
  art(@Param("file") file: string, @Req() req: Request, @Res() res: Response) {
    if (file.includes("..") || file.includes("/")) throw new NotFoundException();
    const path = join(artDir(), file);
    if (!existsSync(path)) throw new NotFoundException();
    sendFile(path, req, res, "public, max-age=86400");
  }

  @Get(":episodeId/:file")
  async file(
    @Param("episodeId") episodeId: string,
    @Param("file") file: string,
    @Req() req: Request & { user?: AuthUser },
    @Res() res: Response
  ) {
    if (file.includes("..") || file.includes("/")) throw new NotFoundException();
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: {
        publish: true,
        season: { select: { title: { select: { publish: true } } } }
      }
    });
    if (!episode) throw new NotFoundException();
    if (!canReadEpisodeMedia(episode.publish, episode.season.title.publish, req.user)) {
      throw new NotFoundException();
    }
    const published =
      episode.publish === PublishStatus.PUBLISHED && episode.season.title.publish === PublishStatus.PUBLISHED;
    const path = join(episodeDir(episodeId), file);
    if (!existsSync(path)) throw new NotFoundException();
    sendFile(path, req, res, published ? "public, max-age=60" : "private, no-store");
  }
}
