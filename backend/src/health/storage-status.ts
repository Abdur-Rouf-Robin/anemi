import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { backupRoot, mediaRoot } from "../media/media.paths";

export type StorageStatus = {
  mediaBytes: number;
  mediaFiles: number;
  backupBytes: number;
  lastBackup: {
    at: string;
    name: string;
    dump: boolean;
    mediaArchive: boolean;
    ageHours: number;
  } | null;
};

const STAMP = /^(\d{8})-(\d{6})$/;

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)} ${units[i]}`;
}

export function backupStampDate(name: string) {
  const match = name.match(STAMP);
  if (!match) return null;
  const day = match[1];
  const time = match[2];
  const iso = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function pickLatestBackupName(names: string[]) {
  return names
    .filter((name) => backupStampDate(name))
    .sort((a, b) => (backupStampDate(a)?.getTime() ?? 0) - (backupStampDate(b)?.getTime() ?? 0))
    .at(-1) ?? null;
}

async function directorySize(root: string) {
  let bytes = 0;
  let files = 0;
  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
        continue;
      }
      if (!entry.isFile()) continue;
      try {
        const info = await stat(path);
        bytes += info.size;
        files += 1;
      } catch {
        /* skip unreadable files */
      }
    }
  }
  await walk(root);
  return { bytes, files };
}

let cached: { at: number; value: StorageStatus } | null = null;

export async function readStorage(now = new Date()): Promise<StorageStatus> {
  if (cached && now.getTime() - cached.at < 15_000) return cached.value;
  const media = await directorySize(mediaRoot());
  const backupsDir = backupRoot();
  const backups = await directorySize(backupsDir);
  let names: string[] = [];
  try {
    names = await readdir(backupsDir);
  } catch {
    names = [];
  }
  const latest = pickLatestBackupName(names);
  let lastBackup: StorageStatus["lastBackup"] = null;
  if (latest) {
    const at = backupStampDate(latest) ?? now;
    let dump = false;
    let mediaArchive = false;
    try {
      await stat(join(backupsDir, latest, "anemi.dump"));
      dump = true;
    } catch {
      dump = false;
    }
    try {
      await stat(join(backupsDir, latest, "media.tgz"));
      mediaArchive = true;
    } catch {
      mediaArchive = false;
    }
    if (!mediaArchive) {
      try {
        const copy = await stat(join(backupsDir, latest, "media"));
        mediaArchive = copy.isDirectory();
      } catch {
        mediaArchive = false;
      }
    }
    lastBackup = {
      at: at.toISOString(),
      name: latest,
      dump,
      mediaArchive,
      ageHours: Math.max(0, Math.round((now.getTime() - at.getTime()) / 3_600_000))
    };
  }
  const value = {
    mediaBytes: media.bytes,
    mediaFiles: media.files,
    backupBytes: backups.bytes,
    lastBackup
  };
  cached = { at: now.getTime(), value };
  return value;
}

export function resetStorageCache() {
  cached = null;
}
