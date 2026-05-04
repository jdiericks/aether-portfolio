-- AlterTable
ALTER TABLE "Client" ADD COLUMN "packageType" TEXT NOT NULL DEFAULT 'buyer';
ALTER TABLE "Client" ADD COLUMN "projectStatus" TEXT NOT NULL DEFAULT 'Getting started';
ALTER TABLE "Client" ADD COLUMN "interestSummary" TEXT;
ALTER TABLE "Client" ADD COLUMN "sellerReport" TEXT;

-- CreateTable
CREATE TABLE "ClientListing" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientListing_clientId_listingId_key" ON "ClientListing"("clientId", "listingId");

-- CreateIndex
CREATE INDEX "ClientListing_clientId_order_idx" ON "ClientListing"("clientId", "order");

-- CreateIndex
CREATE INDEX "ClientListing_listingId_idx" ON "ClientListing"("listingId");

-- AddForeignKey
ALTER TABLE "ClientListing" ADD CONSTRAINT "ClientListing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientListing" ADD CONSTRAINT "ClientListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
