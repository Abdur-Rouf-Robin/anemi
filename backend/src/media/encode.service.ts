import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { spawn, type ChildProcess } from "node:child_process";
import { access, copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PrismaService } from "../prisma/prisma.service";
import { encodeReadyData } from "./encode-ready";
import { ffmpegAvailable, ffmpegBin, probeCodecs, probeDuration } from "./ffmpeg";
import type { EncodeMode, EncodeSnapshot } from "./encode-live";
import { parseFfmpegProgress, progressPercent } from "./ffmpeg-progress";
import { shouldCopyToHls } from "./hls-source";
import { episodeDir } from "./media.paths";

@Injectable()
export class EncodeService implements OnModuleInit {
  private readonly logger = new Logger(EncodeService.name);
  private queue: string[] = [];
  private busy = false;
  private currentId: string | null = null;
  private currentChild: ChildProcess | null = null;
  private cancelled = new Set<string>();
  private percent = 0;
  private mode: EncodeMode | null = null;

  constructor(private readonly prisma: PrismaService) {}

  snapshot(): EncodeSnapshot {
    return {
      currentId: this.currentId,
      percent: this.percent,
      mode: this.mode,
      queue: [...this.queue],
      busy: this.busy
    };
  }

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
    this.cancelled.delete(episodeId);
    if (!this.queue.includes(episodeId)) this.queue.push(episodeId);
    void this.pump();
  }

  async retry(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException("Episode not found");
    try {
      await access(join(episodeDir(episodeId), "source.mp4"));
    } catch {
      throw new BadRequestException("Upload a source video before retrying encode");
    }
    this.cancelled.delete(episodeId);
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { encodeStatus: "queued", encodeError: null }
    });
    await this.enqueue(episodeId, true);
    return { ok: true, encodeStatus: "queued" };
  }

  async cancel(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException("Episode not found");
    this.cancelled.add(episodeId);
    this.queue = this.queue.filter((id) => id !== episodeId);
    if (this.currentId === episodeId) this.currentChild?.kill("SIGKILL");
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { encodeStatus: "idle", encodeError: "Cancelled" }
    });
    await this.finishJob(episodeId, "cancelled", "Cancelled");
    return { ok: true, encodeStatus: "idle" };
  }

  private async pump() {
    if (this.busy) return;
    const episodeId = this.queue.shift();
    if (!episodeId) return;
    this.busy = true;
    this.currentId = episodeId;
    this.percent = 0;
    this.mode = null;
    try {
      if (this.cancelled.has(episodeId)) {
        this.cancelled.delete(episodeId);
        return;
      }
      await this.run(episodeId);
    } catch (error) {
      if (this.cancelled.has(episodeId)) {
        this.cancelled.delete(episodeId);
        return;
      }
      const message = error instanceof Error ? error.message : "Encode failed";
      this.logger.error(message);
      await this.prisma.episode.update({
        where: { id: episodeId },
        data: { encodeStatus: "failed", encodeError: message }
      });
      await this.finishJob(episodeId, "failed", message);
    } finally {
      this.currentId = null;
      this.currentChild = null;
      this.percent = 0;
      this.mode = null;
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
      this.mode = "original";
      this.percent = 50;
      await copyFile(source, join(dir, "original.mp4"));
      const videoUrl = `/media/${episodeId}/original.mp4`;
      this.percent = 100;
      await this.prisma.episode.update({
        where: { id: episodeId },
        data: encodeReadyData(videoUrl, "ffmpeg not installed; serving the original file. Install ffmpeg for HLS.")
      });
      await this.finishJob(episodeId, "ready", "ffmpeg not installed; serving the original file.", videoUrl);
      return;
    }

    const playlist = join(dir, "index.m3u8");
    const codecs = await probeCodecs(source, ffmpeg);
    const copy = codecs ? shouldCopyToHls(codecs.video, codecs.audio) : false;
    this.mode = copy ? "copy" : "transcode";
    const durationSec = await probeDuration(source, ffmpeg);
    await this.spawnFfmpeg(
      ffmpeg,
      copy
        ? [
            "-y",
            "-i",
            source,
            "-c",
            "copy",
            "-hls_time",
            "6",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            join(dir, "seg_%03d.ts"),
            playlist
          ]
        : [
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
          ],
      (seconds) => {
        this.percent = progressPercent(seconds, durationSec ?? 0);
      }
    );
    this.percent = 100;
    await writeFile(join(dir, "master.m3u8"), "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000\nindex.m3u8\n");
    const videoUrl = `/media/${episodeId}/master.m3u8`;
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: encodeReadyData(videoUrl)
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

  private spawnFfmpeg(bin: string, args: string[], onProgress?: (seconds: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(bin, ["-nostats", "-progress", "pipe:1", ...args], { stdio: ["ignore", "pipe", "pipe"] });
      let err = "";
      const note = (chunk: string) => {
        const seconds = parseFfmpegProgress(chunk);
        if (seconds != null) onProgress?.(seconds);
      };
      child.stdout.on("data", (chunk) => note(String(chunk)));
      child.stderr.on("data", (chunk) => {
        const text = String(chunk);
        err += text;
        note(text);
      });
      this.currentChild = child;
      child.on("error", reject);
      child.on("exit", (code) => {
        if (this.currentId && this.cancelled.has(this.currentId)) {
          reject(new Error("Cancelled"));
          return;
        }
        if (code === 0) resolve();
        else reject(new Error(err.slice(-400) || `ffmpeg exited ${code}`));
      });
    });
  }
}
