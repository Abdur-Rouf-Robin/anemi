ALTER TABLE "Title" ADD COLUMN "trailerUrl" TEXT;
ALTER TABLE "Title" ADD COLUMN "producers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "TitleCharacter" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SUPPORTING',
    "imageUrl" TEXT,
    "actor" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TitleCharacter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TitleArtwork" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TitleArtwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkipSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "introStartSec" INTEGER,
    "introEndSec" INTEGER,
    "outroStartSec" INTEGER,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkipSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TitleCharacter_titleId_sort_idx" ON "TitleCharacter"("titleId", "sort");
CREATE INDEX "TitleArtwork_titleId_sort_idx" ON "TitleArtwork"("titleId", "sort");
CREATE INDEX "SkipSuggestion_status_createdAt_idx" ON "SkipSuggestion"("status", "createdAt");

ALTER TABLE "TitleCharacter" ADD CONSTRAINT "TitleCharacter_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TitleArtwork" ADD CONSTRAINT "TitleArtwork_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkipSuggestion" ADD CONSTRAINT "SkipSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkipSuggestion" ADD CONSTRAINT "SkipSuggestion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
