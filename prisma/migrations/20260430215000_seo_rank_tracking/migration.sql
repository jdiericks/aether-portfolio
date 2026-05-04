CREATE TABLE "SeoKeyword" (
  "id" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en-US',
  "market" TEXT,
  "device" TEXT NOT NULL DEFAULT 'desktop',
  "targetUrl" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoKeyword_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeoRankSnapshot" (
  "id" TEXT NOT NULL,
  "keywordId" TEXT NOT NULL,
  "searchEngine" TEXT NOT NULL DEFAULT 'google',
  "device" TEXT NOT NULL DEFAULT 'desktop',
  "location" TEXT,
  "rank" INTEGER,
  "url" TEXT,
  "title" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "metadata" JSONB,

  CONSTRAINT "SeoRankSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeoKeyword_keyword_locale_market_device_key" ON "SeoKeyword"("keyword", "locale", "market", "device");
CREATE INDEX "SeoKeyword_isActive_priority_idx" ON "SeoKeyword"("isActive", "priority");
CREATE INDEX "SeoRankSnapshot_keywordId_checkedAt_idx" ON "SeoRankSnapshot"("keywordId", "checkedAt");
CREATE INDEX "SeoRankSnapshot_searchEngine_device_checkedAt_idx" ON "SeoRankSnapshot"("searchEngine", "device", "checkedAt");
CREATE INDEX "SeoRankSnapshot_rank_idx" ON "SeoRankSnapshot"("rank");

ALTER TABLE "SeoRankSnapshot"
ADD CONSTRAINT "SeoRankSnapshot_keywordId_fkey"
FOREIGN KEY ("keywordId") REFERENCES "SeoKeyword"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
