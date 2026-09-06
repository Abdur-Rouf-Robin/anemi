import assert from "node:assert/strict";
import { test } from "node:test";

import { buildLatestRss, buildScheduleIcs, icsEscape, xmlEscape } from "../src/catalog/feeds";

const sample = {
  episodeId: "ep1",
  number: 3,
  name: "Harbor & lights",
  audioKind: "SUB",
  airDate: "2026-09-06T15:00:00.000Z",
  durationSec: 1440,
  seasonNumber: 1,
  title: { name: "Harbor Lights", slug: "harbor-lights", synopsis: "A quiet port." }
};

test("xmlEscape encodes markup", () => {
  assert.equal(xmlEscape(`<a href="x">A & B</a>`), "&lt;a href=&quot;x&quot;&gt;A &amp; B&lt;/a&gt;");
});

test("buildLatestRss includes published episodes", () => {
  const xml = buildLatestRss("https://anime.arrobin.com", [sample]);
  assert.match(xml, /<rss version="2.0">/);
  assert.match(xml, /Harbor Lights — S01E03 SUB/);
  assert.match(xml, /https:\/\/anime\.arrobin\.com\/watch\/ep1/);
  assert.match(xml, /Harbor &amp; lights/);
});

test("icsEscape and schedule calendar", () => {
  assert.equal(icsEscape("A, B; C"), "A\\, B\\; C");
  const ics = buildScheduleIcs("https://anime.arrobin.com", [{ date: "2026-09-06", items: [sample] }]);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /UID:episode-ep1@anemi/);
  assert.match(ics, /DTSTART:20260906T150000Z/);
  assert.match(ics, /SUMMARY:Harbor Lights — E3 Harbor & lights/);
});
