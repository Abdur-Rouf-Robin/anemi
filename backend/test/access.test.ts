import assert from "node:assert/strict";
import { test } from "node:test";

import { hashResetToken } from "../src/auth/reset-token";
import { inviteIsOpen, inviteMatchesEmail, normalizeSignupMode } from "../src/auth/signup-mode";

test("signup mode defaults to invite", () => {
  assert.equal(normalizeSignupMode(null), "invite");
  assert.equal(normalizeSignupMode("open"), "open");
  assert.equal(normalizeSignupMode("closed"), "closed");
  assert.equal(normalizeSignupMode("weird"), "invite");
});

test("used, revoked, or expired invites are closed", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  assert.equal(inviteIsOpen({ expiresAt: future, usedAt: null, revokedAt: null }), true);
  assert.equal(inviteIsOpen({ expiresAt: future, usedAt: new Date(), revokedAt: null }), false);
  assert.equal(inviteIsOpen({ expiresAt: future, usedAt: null, revokedAt: new Date() }), false);
  assert.equal(inviteIsOpen({ expiresAt: past, usedAt: null, revokedAt: null }), false);
});

test("reserved invite email must match", () => {
  assert.equal(inviteMatchesEmail(null, "a@b.co"), true);
  assert.equal(inviteMatchesEmail("A@B.co", "a@b.co"), true);
  assert.equal(inviteMatchesEmail("other@b.co", "a@b.co"), false);
});

test("reset tokens hash stably", () => {
  assert.equal(hashResetToken("abc"), hashResetToken("abc"));
  assert.notEqual(hashResetToken("abc"), hashResetToken("abd"));
});
