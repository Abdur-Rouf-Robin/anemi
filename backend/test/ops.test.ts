import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import { smtpConfigured } from "../src/admin/mailer";
import { ffmpegAvailable } from "../src/media/ffmpeg";
import { mediaRoot } from "../src/media/media.paths";

test("smtpConfigured follows SMTP_HOST", () => {
  const host = process.env.SMTP_HOST;
  const url = process.env.SMTP_URL;
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_URL;
  try {
    assert.equal(smtpConfigured(), false);
    process.env.SMTP_HOST = "localhost";
    assert.equal(smtpConfigured(), true);
  } finally {
    if (host === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = host;
    if (url === undefined) delete process.env.SMTP_URL;
    else process.env.SMTP_URL = url;
  }
});

test("ffmpegAvailable returns false for a missing binary", async () => {
  assert.equal(await ffmpegAvailable("/this/ffmpeg/does-not-exist"), false);
});

test("mediaRoot creates the configured directory", () => {
  const dir = mkdtempSync(join(tmpdir(), "anemi-media-"));
  const prev = process.env.MEDIA_ROOT;
  process.env.MEDIA_ROOT = dir;
  try {
    assert.equal(mediaRoot(), dir);
  } finally {
    if (prev === undefined) delete process.env.MEDIA_ROOT;
    else process.env.MEDIA_ROOT = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});
