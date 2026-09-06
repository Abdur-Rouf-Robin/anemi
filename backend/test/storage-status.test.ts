import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  backupStampDate,
  formatBytes,
  pickLatestBackupName,
  readStorage,
  resetStorageCache
} from "../src/health/storage-status";

test("formatBytes uses compact units", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2.0 KB");
  assert.equal(formatBytes(10 * 1024 * 1024), "10 MB");
});

test("pickLatestBackupName uses the newest stamp", () => {
  assert.equal(pickLatestBackupName(["notes.txt", "20260101-010101", "20260906-120000"]), "20260906-120000");
  assert.equal(pickLatestBackupName(["readme"]), null);
  assert.ok(backupStampDate("20260906-153045"));
  assert.equal(backupStampDate("backup"), null);
});

test("readStorage counts media and the latest dump", async () => {
  const root = mkdtempSync(join(tmpdir(), "anemi-store-"));
  const media = join(root, "media");
  const backups = join(root, "backups", "20260906-120000");
  mkdirSync(media, { recursive: true });
  mkdirSync(backups, { recursive: true });
  writeFileSync(join(media, "clip.mp4"), "abcd");
  writeFileSync(join(backups, "anemi.dump"), "dump");
  const prevMedia = process.env.MEDIA_ROOT;
  const prevBackup = process.env.BACKUP_ROOT;
  process.env.MEDIA_ROOT = media;
  process.env.BACKUP_ROOT = join(root, "backups");
  resetStorageCache();
  try {
    const status = await readStorage(new Date("2026-09-06T14:00:00"));
    assert.equal(status.mediaFiles, 1);
    assert.equal(status.mediaBytes, 4);
    assert.equal(status.lastBackup?.name, "20260906-120000");
    assert.equal(status.lastBackup?.dump, true);
    assert.equal(status.lastBackup?.mediaArchive, false);
    assert.equal(status.lastBackup?.ageHours, 2);
  } finally {
    if (prevMedia === undefined) delete process.env.MEDIA_ROOT;
    else process.env.MEDIA_ROOT = prevMedia;
    if (prevBackup === undefined) delete process.env.BACKUP_ROOT;
    else process.env.BACKUP_ROOT = prevBackup;
    resetStorageCache();
    rmSync(root, { recursive: true, force: true });
  }
});
