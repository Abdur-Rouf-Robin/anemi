import assert from "node:assert/strict";
import { test } from "node:test";

import { playlistSlug } from "../src/playlists/playlist-slug";

test("playlistSlug normalizes names", () => {
  assert.equal(playlistSlug(" Weekend Watch "), "weekend-watch");
  assert.equal(playlistSlug("Sci-Fi & Mecha!!"), "sci-fi-mecha");
  assert.equal(playlistSlug("!!!"), "playlist");
});
