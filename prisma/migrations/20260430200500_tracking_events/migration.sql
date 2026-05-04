CREATE TABLE "TrackingEvent" (
  "id" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "path" TEXT,
  "source" TEXT,
  "sessionId" TEXT,
  "clientId" TEXT,
  "listingId" TEXT,
  "listingSlug" TEXT,
  "metadata" JSONB,
  "userAgent" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrackingEvent_eventName_createdAt_idx" ON "TrackingEvent"("eventName", "createdAt");
CREATE INDEX "TrackingEvent_clientId_createdAt_idx" ON "TrackingEvent"("clientId", "createdAt");
CREATE INDEX "TrackingEvent_listingId_createdAt_idx" ON "TrackingEvent"("listingId", "createdAt");
CREATE INDEX "TrackingEvent_listingSlug_createdAt_idx" ON "TrackingEvent"("listingSlug", "createdAt");
CREATE INDEX "TrackingEvent_createdAt_idx" ON "TrackingEvent"("createdAt");
