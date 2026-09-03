export type Cue = { start: number; end: number; text: string };

function parseStamp(raw: string) {
  const clean = raw.trim().replace(",", ".").split(" ")[0] ?? "0";
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

export function parseCaptions(source: string): Cue[] {
  const blocks = source
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split(/\n\n+/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line && !/^WEBVTT/i.test(line) && !/^NOTE\b/.test(line) && !/^\d+$/.test(line));
    const timeLine = lines.find((line) => line.includes("-->"));
    if (!timeLine) continue;
    const [startRaw, endRaw] = timeLine.split("-->");
    const text = lines
      .filter((line) => line !== timeLine)
      .join("\n")
      .replace(/<\/?[^>]+>/g, "")
      .trim();
    if (!text) continue;
    cues.push({ start: parseStamp(startRaw ?? "0"), end: parseStamp(endRaw ?? "0"), text });
  }
  return cues;
}

export function cueAt(cues: Cue[], time: number): Cue | null {
  for (const cue of cues) {
    if (time >= cue.start && time < cue.end) return cue;
  }
  return null;
}

export function parseClockInput(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.includes(":")) {
    const parts = raw.split(":").map(Number);
    if (parts.some((n) => Number.isNaN(n))) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  const sec = Number(raw);
  return Number.isFinite(sec) ? sec : null;
}
