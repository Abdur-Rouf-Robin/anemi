import assert from "node:assert/strict";
import { test } from "node:test";

import { encodeJobProgress } from "../src/media/encode-live";
import { parseFfmpegClock, parseFfmpegProgress, progressPercent } from "../src/media/ffmpeg-progress";
import { resolveUnderRoot } from "../src/media/inbox-path";
import { shouldCopyToHls } from "../src/media/hls-source";
import { accelRedirect, mediaAccelPrefix, shouldAccelMedia } from "../src/media/media-accel";

test("resolveUnderRoot stays inside the inbox", () => {
  const root = "/var/www/anemi/data/inbox";
  assert.equal(resolveUnderRoot(root, "harbor/s01"), "/var/www/anemi/data/inbox/harbor/s01");
  assert.equal(resolveUnderRoot(root, ""), root);
  assert.throws(() => resolveUnderRoot(root, "../etc"), { message: /inbox/ });
  assert.throws(() => resolveUnderRoot(root, "a/../../etc"), { message: /inbox/ });
});

test("shouldCopyToHls accepts H.264 and AAC", () => {
  assert.equal(shouldCopyToHls("h264", "aac"), true);
  assert.equal(shouldCopyToHls("H264", "AAC"), true);
  assert.equal(shouldCopyToHls("hevc", "aac"), false);
  assert.equal(shouldCopyToHls("h264", "ac3"), false);
});

test("ffmpeg progress parses clocks and percents", () => {
  assert.equal(parseFfmpegClock("00:01:30.00"), 90);
  assert.equal(parseFfmpegProgress("out_time_ms=45000000"), 45);
  assert.equal(parseFfmpegProgress("frame=1\ntime=00:00:10.00\n"), 10);
  assert.equal(progressPercent(45, 90), 50);
  assert.equal(progressPercent(200, 100), 99);
});

test("encodeJobProgress follows the live snapshot", () => {
  const live = {
    currentId: "now",
    percent: 40,
    mode: "copy" as const,
    queue: ["next"],
    busy: true
  };
  assert.deepEqual(encodeJobProgress("now", "encoding", live), { percent: 40, mode: "copy", position: 0 });
  assert.deepEqual(encodeJobProgress("next", "queued", live), { percent: 0, mode: null, position: 1 });
  assert.deepEqual(encodeJobProgress("done", "ready", live), { percent: 100, mode: null, position: null });
});

test("media accel prefix is used only behind a proxy", () => {
  const prev = process.env.MEDIA_ACCEL_PREFIX;
  process.env.MEDIA_ACCEL_PREFIX = "/internal-anemi-media/";
  try {
    assert.equal(mediaAccelPrefix(), "/internal-anemi-media/");
    assert.equal(accelRedirect("ep1/index.m3u8"), "/internal-anemi-media/ep1/index.m3u8");
    assert.equal(shouldAccelMedia({ headers: {} } as never), false);
    assert.equal(shouldAccelMedia({ headers: { "x-forwarded-proto": "https" } } as never), false);
    assert.equal(shouldAccelMedia({ headers: { "x-anemi-accel": "1" } } as never), true);
  } finally {
    if (prev === undefined) delete process.env.MEDIA_ACCEL_PREFIX;
    else process.env.MEDIA_ACCEL_PREFIX = prev;
  }
});
