-- AlterTable
ALTER TABLE "Title" ADD COLUMN "nameJa" TEXT;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CANON';
