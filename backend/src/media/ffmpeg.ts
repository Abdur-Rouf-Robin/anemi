import { spawn } from "node:child_process";

export function ffmpegBin() {
  return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

export function ffmpegAvailable(bin = ffmpegBin()) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(bin, ["-version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

export function probeDuration(source: string, bin = ffmpegBin()) {
  return new Promise<number | null>((resolve) => {
    const child = spawn(
      bin.replace(/ffmpeg$/i, "ffprobe"),
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", source],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += String(chunk);
    });
    child.on("error", () => resolve(null));
    child.on("exit", (code) => {
      const seconds = Number(out.trim());
      resolve(code === 0 && Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    });
  });
}

export function probeCodecs(source: string, bin = ffmpegBin()) {
  return new Promise<{ video: string; audio: string | null } | null>((resolve) => {
    const child = spawn(
      bin.replace(/ffmpeg$/i, "ffprobe"),
      ["-v", "error", "-show_entries", "stream=codec_type,codec_name", "-of", "json", source],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += String(chunk);
    });
    child.on("error", () => resolve(null));
    child.on("exit", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(out) as { streams?: { codec_type?: string; codec_name?: string }[] };
        const video = parsed.streams?.find((row) => row.codec_type === "video")?.codec_name ?? "";
        const audio = parsed.streams?.find((row) => row.codec_type === "audio")?.codec_name ?? null;
        resolve(video ? { video, audio } : null);
      } catch {
        resolve(null);
      }
    });
  });
}
