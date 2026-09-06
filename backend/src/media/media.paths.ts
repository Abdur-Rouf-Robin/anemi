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

export function packDir() {
  const dir = join(mediaRoot(), "pack");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function inboxRoot() {
  const root = process.env.MEDIA_INBOX?.trim() || join(mediaRoot(), "..", "inbox");
  mkdirSync(root, { recursive: true });
  return root;
}

export function backupRoot() {
  const explicit = process.env.BACKUP_ROOT?.trim();
  if (explicit) return explicit;
  return join(mediaRoot(), "..", "backups");
}
