import assert from "node:assert/strict";
import { test } from "node:test";

import { episodeReadyToPublish } from "../src/admin/episode-ready";

test("ready encode with a file can publish", () => {
  assert.equal(episodeReadyToPublish({ videoUrl: "/media/e/master.m3u8", encodeStatus: "ready", publish: "DRAFT" }), true);
  assert.equal(episodeReadyToPublish({ videoUrl: "https://cdn.example/a.mp4", encodeStatus: "idle", publish: "DRAFT" }), true);
});

test("missing file, busy encode, or already published stays draft", () => {
  assert.equal(episodeReadyToPublish({ videoUrl: null, encodeStatus: "ready", publish: "DRAFT" }), false);
  assert.equal(episodeReadyToPublish({ videoUrl: "/media/e/master.m3u8", encodeStatus: "queued", publish: "DRAFT" }), false);
  assert.equal(episodeReadyToPublish({ videoUrl: "/media/e/master.m3u8", encodeStatus: "encoding", publish: "DRAFT" }), false);
  assert.equal(episodeReadyToPublish({ videoUrl: "/media/e/master.m3u8", encodeStatus: "failed", publish: "DRAFT" }), false);
  assert.equal(episodeReadyToPublish({ videoUrl: "/media/e/master.m3u8", encodeStatus: "ready", publish: "PUBLISHED" }), false);
});
