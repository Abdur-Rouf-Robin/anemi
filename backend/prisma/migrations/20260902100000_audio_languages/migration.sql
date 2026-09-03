ALTER TABLE "Episode" ADD COLUMN "language" TEXT NOT NULL DEFAULT '';

DROP INDEX "Episode_seasonId_number_audioKind_key";

CREATE UNIQUE INDEX "Episode_seasonId_number_audioKind_language_key" ON "Episode"("seasonId", "number", "audioKind", "language");

CREATE TABLE "CaptionTrack" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "CaptionTrack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaptionTrack_episodeId_language_key" ON "CaptionTrack"("episodeId", "language");

ALTER TABLE "CaptionTrack" ADD CONSTRAINT "CaptionTrack_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CaptionTrack" ("id", "episodeId", "language", "url")
SELECT concat('cap_', "id"), "id", CASE WHEN "language" = '' THEN 'Captions' ELSE "language" END, "subtitleUrl"
FROM "Episode"
WHERE "subtitleUrl" IS NOT NULL AND "subtitleUrl" <> '';
