import assert from "node:assert/strict";
import { test } from "node:test";

import { studioSlug } from "../src/lib/studio-slug";

test("studioSlug normalizes studio names", () => {
  assert.equal(studioSlug("Production I.G"), "production-ig");
  assert.equal(studioSlug("  Bones  "), "bones");
  assert.equal(studioSlug("!!!"), "studio");
});
