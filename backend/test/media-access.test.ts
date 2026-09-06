import assert from "node:assert/strict";
import { test } from "node:test";
import { PublishStatus, Role } from "@prisma/client";

import { sessionVersionMatches } from "../src/auth/session-version";
import { publicHealthView } from "../src/health/health-status";
import { encryptField, decryptField, fieldEncryptionKeySource } from "../src/lib/field-encryption";
import { encodeReadyData } from "../src/media/encode-ready";
import { canReadEpisodeMedia } from "../src/media/media-access";

const staff = { id: "1", email: "a@b.co", displayName: "A", role: Role.ADMIN };

test("guests can only read published episode files", () => {
  assert.equal(canReadEpisodeMedia(PublishStatus.PUBLISHED, PublishStatus.PUBLISHED, null), true);
  assert.equal(canReadEpisodeMedia(PublishStatus.DRAFT, PublishStatus.PUBLISHED, null), false);
  assert.equal(canReadEpisodeMedia(PublishStatus.PUBLISHED, PublishStatus.DRAFT, null), false);
});

test("staff can preview draft episode files", () => {
  assert.equal(canReadEpisodeMedia(PublishStatus.DRAFT, PublishStatus.DRAFT, staff), true);
  assert.equal(canReadEpisodeMedia(PublishStatus.UNLISTED, PublishStatus.PUBLISHED, staff), true);
});

test("encode ready patch does not publish the episode", () => {
  const patch = encodeReadyData("/media/ep/master.m3u8");
  assert.equal(patch.encodeStatus, "ready");
  assert.equal("publish" in patch, false);
});

test("stale JWT version is rejected", () => {
  assert.equal(sessionVersionMatches(0, 0), true);
  assert.equal(sessionVersionMatches(undefined, 0), true);
  assert.equal(sessionVersionMatches(0, 1), false);
  assert.equal(sessionVersionMatches(2, 1), false);
});

test("field encryption prefers MFA_SECRET", () => {
  const jwt = process.env.JWT_SECRET;
  const mfa = process.env.MFA_SECRET;
  process.env.JWT_SECRET = "jwt-key-for-test";
  process.env.MFA_SECRET = "mfa-key-for-test";
  try {
    assert.equal(fieldEncryptionKeySource(), "mfa-key-for-test");
    const packed = encryptField("totp-secret");
    assert.equal(decryptField(packed), "totp-secret");
  } finally {
    if (jwt === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = jwt;
    if (mfa === undefined) delete process.env.MFA_SECRET;
    else process.env.MFA_SECRET = mfa;
  }
});

test("public health hides capability flags", () => {
  const full = { ok: true, service: "anemi" as const, db: true, media: true, inbox: true, ffmpeg: true, smtp: false };
  assert.deepEqual(publicHealthView(full), { ok: true, service: "anemi" });
});
