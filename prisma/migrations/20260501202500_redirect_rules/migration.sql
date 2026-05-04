CREATE TABLE "RedirectRule" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 308,
    "preserveQuery" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedirectRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RedirectRule_sourcePath_key" ON "RedirectRule"("sourcePath");
CREATE INDEX "RedirectRule_isActive_sourcePath_idx" ON "RedirectRule"("isActive", "sourcePath");
