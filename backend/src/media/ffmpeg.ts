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
