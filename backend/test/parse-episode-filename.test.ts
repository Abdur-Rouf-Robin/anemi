import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEpisodeFilename } from "../src/admin/parse-episode-filename";

test("parses SxxExx and 1x02 names", () => {
  assert.deepEqual(parseEpisodeFilename("Harbor.S01E03.mkv"), { season: 1, number: 3, audioKind: "SUB" });
  assert.deepEqual(parseEpisodeFilename("show 1x02 dub.mp4"), { season: 1, number: 2, audioKind: "DUB" });
});

test("parses Episode / E prefixes and lone numbers", () => {
  assert.deepEqual(parseEpisodeFilename("Episode 07.mp4"), { number: 7, audioKind: "SUB" });
  assert.deepEqual(parseEpisodeFilename("E12-dub.mov"), { number: 12, audioKind: "DUB" });
  assert.deepEqual(parseEpisodeFilename("04.webm"), { number: 4, audioKind: "SUB" });
});

test("rejects names without an episode number", () => {
  assert.equal(parseEpisodeFilename("trailer.mp4"), null);
  assert.equal(parseEpisodeFilename(""), null);
});
