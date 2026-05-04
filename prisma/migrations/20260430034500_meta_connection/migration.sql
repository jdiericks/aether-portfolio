-- CreateTable
CREATE TABLE "MetaConnection" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT,
    "providerUserName" TEXT,
    "accessToken" TEXT NOT NULL,
    "tokenType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pages" JSONB,
    "instagramAccounts" JSONB,
    "selectedPageId" TEXT,
    "selectedInstagramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MetaConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetaConnection_providerUserId_idx" ON "MetaConnection"("providerUserId");
