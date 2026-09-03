-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncodeJob" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "EncodeJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EncodeJob_status_createdAt_idx" ON "EncodeJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EncodeJob_episodeId_createdAt_idx" ON "EncodeJob"("episodeId", "createdAt");

-- AddForeignKey
ALTER TABLE "EncodeJob" ADD CONSTRAINT "EncodeJob_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
