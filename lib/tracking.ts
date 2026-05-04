import { headers } from "next/headers";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_EVENT_NAME_LENGTH = 80;
const MAX_ENTITY_ID_LENGTH = 120;
const MAX_PATH_LENGTH = 500;
const MAX_REFERRER_LENGTH = 1_000;

export type TrackingEventInput = {
  eventName: string;
  listingId?: string | null;
  listingSlug?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown> | null;
  clientId?: string | null;
  sessionId?: string | null;
  source?: string | null;
};

function cleanString(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function safeMetadata(metadata: Record<string, unknown> | null | undefined): Prisma.InputJsonValue {
  if (!metadata) return {};
  return JSON.parse(JSON.stringify(metadata).slice(0, 10_000)) as Prisma.InputJsonValue;
}

function hashIpAddress(ipAddress: string | null) {
  return ipAddress
    ? createHash("sha256").update(ipAddress).digest("hex").slice(0, 64)
    : null;
}

export async function createTrackingEvent(input: TrackingEventInput) {
  const eventName = cleanString(input.eventName, MAX_EVENT_NAME_LENGTH);
  if (!eventName) return null;

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") || "";
  const ipAddress = cleanString(forwardedFor.split(",")[0], 80);
  const userAgent = cleanString(headerStore.get("user-agent"), 500);
  const referrer = cleanString(headerStore.get("referer"), MAX_REFERRER_LENGTH);

  return prisma.trackingEvent.create({
    data: {
      eventName,
      path: cleanString(input.path, MAX_PATH_LENGTH),
      clientId: cleanString(input.clientId, MAX_ENTITY_ID_LENGTH),
      listingId: cleanString(input.listingId, MAX_ENTITY_ID_LENGTH),
      listingSlug: cleanString(input.listingSlug, MAX_ENTITY_ID_LENGTH),
      sessionId: cleanString(input.sessionId, MAX_ENTITY_ID_LENGTH),
      source: cleanString(input.source, 80) || "site",
      userAgent,
      ipHash: hashIpAddress(ipAddress),
      metadata: safeMetadata({
        ...input.metadata,
        referrer,
      }),
    },
  });
}
