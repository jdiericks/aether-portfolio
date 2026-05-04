-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "agentName" TEXT;
ALTER TABLE "Listing" ADD COLUMN "agentTitle" TEXT;
ALTER TABLE "Listing" ADD COLUMN "agentEmail" TEXT;
ALTER TABLE "Listing" ADD COLUMN "agentPhone" TEXT;
ALTER TABLE "Listing" ADD COLUMN "agentWhatsapp" TEXT;
ALTER TABLE "Listing" ADD COLUMN "agentPhotoUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN "gallery" JSONB;
