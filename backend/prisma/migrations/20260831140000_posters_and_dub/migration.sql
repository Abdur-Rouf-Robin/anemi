-- AlterTable
ALTER TABLE "Title" ADD COLUMN "posterUrl" TEXT;
ALTER TABLE "Title" ADD COLUMN "backdropUrl" TEXT;

-- DropIndex
DROP INDEX "Episode_seasonId_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_audioKind_key" ON "Episode"("seasonId", "number", "audioKind");
