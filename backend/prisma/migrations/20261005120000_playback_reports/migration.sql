CREATE TABLE "PlaybackReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "episodeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybackReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlaybackReport_episodeId_createdAt_idx" ON "PlaybackReport"("episodeId", "createdAt");

ALTER TABLE "PlaybackReport" ADD CONSTRAINT "PlaybackReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlaybackReport" ADD CONSTRAINT "PlaybackReport_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
