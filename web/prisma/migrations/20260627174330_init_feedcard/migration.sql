-- CreateTable
CREATE TABLE "FeedCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "thumbnailPath" TEXT,
    "thumbnailKind" TEXT NOT NULL DEFAULT 'NONE',
    "originalUrl" TEXT NOT NULL,
    "vaultPath" TEXT,
    "contentHash" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT,
    "trigger" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "upsertedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedCard_originalUrl_key" ON "FeedCard"("originalUrl");

-- CreateIndex
CREATE INDEX "FeedCard_channel_status_publishedAt_idx" ON "FeedCard"("channel", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedCard_channel_externalId_key" ON "FeedCard"("channel", "externalId");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");
