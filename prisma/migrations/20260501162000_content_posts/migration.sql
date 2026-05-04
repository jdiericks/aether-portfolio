CREATE TABLE "ContentPost" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "category" TEXT,
  "body" TEXT NOT NULL DEFAULT '',
  "authorName" TEXT,
  "imageUrl" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentPost_slug_key" ON "ContentPost"("slug");
CREATE INDEX "ContentPost_status_publishedAt_idx" ON "ContentPost"("status", "publishedAt");
