import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { spawn } from "node:child_process";
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PrismaService } from "../prisma/prisma.service";
import { ffmpegAvailable, ffmpegBin } from "./ffmpeg";
import { episodeDir } from "./media.paths";

@Injectable()
export class EncodeService implements OnModuleInit {
  private readonly logger = new Logger(EncodeService.name);
  private queue: string[] = [];
  private busy = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const stuck = await this.prisma.episode.findMany({
      where: { encodeStatus: { in: ["queued", "encoding"] } },
      select: { id: true }
    });
    for (const row of stuck) {
      if (!this.queue.includes(row.id)) this.queue.push(row.id);
    }
    if (stuck.length) this.logger.log(`Resuming ${stuck.length} encode job(s)`);
    void this.pump();
  }

  async enqueue(episodeId: string, record = true) {
    if (record) {
      await this.prisma.encodeJob.create({
        data: { episodeId, status: "queued" }
      });
    }
    if (!this.queue.includes(episodeId)) this.queue.push(episodeId);
    void this.pump();
  }

  private async pump() {
    if (this.busy) return;
    const episodeId = this.queue.shift();
    if (!episodeId) return;
    this.busy = true;
    try {
      await this.run(episodeId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Encode failed";
      this.logger.error(message);
      await this.prisma.episode.update({
        where: { id: episodeId },
        data: { encodeStatus: "failed", encodeError: message }
      });
      await this.finishJob(episodeId, "failed", message);
    } finally {
      this.busy = false;
      void this.pump();
    }
  }

  private async run(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException("Episode not found");
    const dir = episodeDir(episodeId);
    const source = join(dir, "source.mp4");
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { encodeStatus: "encoding", encodeError: null }
    });
    await this.touchJob(episodeId, "encoding");

    const ffmpeg = ffmpegBin();
    const hasFfmpeg = await ffmpegAvailable(ffmpeg);
    if (!hasFfmpeg) {
      await copyFile(source, join(dir, "original.mp4"));
      const videoUrl = `/media/${episodeId}/original.mp4`;
      await this.prisma.episode.update({
        where: { id: episodeId },
        data: {
          encodeStatus: "ready",
          encodeError: "ffmpeg not installed; serving the original file. Install ffmpeg for HLS.",
          videoUrl,
          publish: "PUBLISHED"
        }
      });
      await this.finishJob(episodeId, "ready", "ffmpeg not installed; serving the original file.", videoUrl);
      return;
    }

    const playlist = join(dir, "index.m3u8");
    await this.spawnFfmpeg(ffmpeg, [
      "-y",
      "-i",
      source,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      join(dir, "seg_%03d.ts"),
      playlist
    ]);
    await writeFile(join(dir, "master.m3u8"), "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000\nindex.m3u8\n");
    const videoUrl = `/media/${episodeId}/master.m3u8`;
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: {
        encodeStatus: "ready",
        encodeError: null,
        videoUrl,
        publish: "PUBLISHED"
      }
    });
    await this.finishJob(episodeId, "ready", null, videoUrl);
  }

  private async touchJob(episodeId: string, status: string) {
    const job = await this.prisma.encodeJob.findFirst({
      where: { episodeId },
      orderBy: { createdAt: "desc" }
    });
    if (!job) return;
    await this.prisma.encodeJob.update({
      where: { id: job.id },
      data: { status, startedAt: job.startedAt ?? new Date(), error: null }
    });
  }

  private async finishJob(episodeId: string, status: string, error?: string | null, videoUrl?: string | null) {
    const job = await this.prisma.encodeJob.findFirst({
      where: { episodeId },
      orderBy: { createdAt: "desc" }
    });
    if (!job) return;
    await this.prisma.encodeJob.update({
      where: { id: job.id },
      data: { status, error: error ?? null, videoUrl: videoUrl ?? job.videoUrl, finishedAt: new Date() }
    });
  }

  private spawnFfmpeg(bin: string, args: string[]) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
      let err = "";
      child.stderr.on("data", (chunk) => {
        err += String(chunk);
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(err.slice(-400) || `ffmpeg exited ${code}`));
      });
    });
  }
}
