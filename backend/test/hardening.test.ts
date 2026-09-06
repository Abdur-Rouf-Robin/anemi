import assert from "node:assert/strict";
import { test } from "node:test";

import { corsOriginSetting, corsOrigins } from "../src/security/cors-origins";
import { allowIpHit } from "../src/auth/ip-rate-limit";

test("corsOrigins splits and trims the allow list", () => {
  const prev = process.env.CORS_ORIGINS;
  process.env.CORS_ORIGINS = "https://anime.arrobin.com, http://127.0.0.1:3100";
  try {
    assert.deepEqual(corsOrigins(), ["https://anime.arrobin.com", "http://127.0.0.1:3100"]);
  } finally {
    if (prev === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = prev;
  }
});

test("corsOriginSetting is an explicit list in production", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevCors = process.env.CORS_ORIGINS;
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = "https://anime.arrobin.com";
  try {
    assert.deepEqual(corsOriginSetting(), ["https://anime.arrobin.com"]);
  } finally {
    if (prevEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevEnv;
    if (prevCors === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = prevCors;
  }
});

test("allowIpHit blocks after the window max", () => {
  const key = `test:${Date.now()}`;
  allowIpHit(key, 2, 60_000);
  allowIpHit(key, 2, 60_000);
  assert.throws(() => allowIpHit(key, 2, 60_000), { status: 429 });
});
