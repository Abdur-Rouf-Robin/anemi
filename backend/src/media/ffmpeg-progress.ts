export function parseFfmpegClock(value: string) {
  const parts = value.trim().split(":");
  if (parts.length !== 3) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  if (![hours, minutes, seconds].every(Number.isFinite)) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseFfmpegProgress(chunk: string) {
  const ms = chunk.match(/out_time_ms=(\d+)/);
  if (ms) return Number(ms[1]) / 1_000_000;
  const clock = chunk.match(/(?:out_time|time)=(\d+:\d+:\d+(?:\.\d+)?)/);
  if (!clock) return null;
  return parseFfmpegClock(clock[1]);
}

export function progressPercent(currentSec: number, durationSec: number) {
  if (!Number.isFinite(currentSec) || !Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return Math.min(99, Math.max(0, Math.round((currentSec / durationSec) * 100)));
}
