import { mkdirSync } from "node:fs";
import { join } from "node:path";

export function mediaRoot() {
  const root = process.env.MEDIA_ROOT?.trim() || join(process.cwd(), "..", "data", "media");
  mkdirSync(root, { recursive: true });
  return root;
}

export function episodeDir(episodeId: string) {
  const dir = join(mediaRoot(), episodeId.replace(/[^a-zA-Z0-9_-]/g, ""));
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function artDir() {
  const dir = join(mediaRoot(), "art");
  mkdirSync(dir, { recursive: true });
  return dir;
}
