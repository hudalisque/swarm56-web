-- CreateTable
CREATE TABLE "SuppressionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalUrl" TEXT NOT NULL,
    "vaultPath" TEXT,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT NOT NULL,
    "reason" TEXT,
    "restoredAt" DATETIME
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "actor" TEXT NOT NULL,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detail" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeedCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "thumbnailPath" TEXT,
    "originalUrl" TEXT NOT NULL,
    "vaultPath" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FeedCard" ("channel", "createdAt", "excerpt", "externalId", "id", "originalUrl", "publishedAt", "thumbnailPath", "title", "updatedAt", "vaultPath") SELECT "channel", "createdAt", "excerpt", "externalId", "id", "originalUrl", "publishedAt", "thumbnailPath", "title", "updatedAt", "vaultPath" FROM "FeedCard";
DROP TABLE "FeedCard";
ALTER TABLE "new_FeedCard" RENAME TO "FeedCard";
CREATE UNIQUE INDEX "FeedCard_originalUrl_key" ON "FeedCard"("originalUrl");
CREATE INDEX "FeedCard_channel_publishedAt_idx" ON "FeedCard"("channel", "publishedAt");
CREATE UNIQUE INDEX "FeedCard_channel_externalId_key" ON "FeedCard"("channel", "externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SuppressionRecord_originalUrl_key" ON "SuppressionRecord"("originalUrl");

-- CreateIndex
CREATE INDEX "SuppressionRecord_restoredAt_idx" ON "SuppressionRecord"("restoredAt");

-- CreateIndex
CREATE INDEX "AdminAudit_at_idx" ON "AdminAudit"("at");

