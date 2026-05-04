import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTrackingEvent } from "@/lib/tracking";

const MAX_PROPERTY_LENGTH = 500;

function safeProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key.slice(0, 80),
      typeof item === "string"
        ? item.slice(0, MAX_PROPERTY_LENGTH)
        : typeof item === "number" || typeof item === "boolean" || item === null
          ? item
          : String(item).slice(0, MAX_PROPERTY_LENGTH),
    ])
  );
}

function requestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName =
      typeof body.eventName === "string" && body.eventName.trim()
        ? body.eventName.trim().slice(0, 120)
        : null;

    if (!eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const properties = safeProperties(body.properties);

    await createTrackingEvent({
      eventName,
      listingId:
        typeof body.listingId === "string" && body.listingId.trim()
          ? body.listingId.trim()
          : null,
      listingSlug:
        typeof properties.listingSlug === "string"
          ? properties.listingSlug
          : null,
      path:
        typeof body.path === "string" && body.path.trim()
          ? body.path.trim().slice(0, 500)
          : null,
      sessionId:
        typeof body.sessionId === "string" && body.sessionId.trim()
          ? body.sessionId.trim().slice(0, 160)
          : null,
      clientId:
        session?.user?.role === "client" && typeof session.user.id === "string"
          ? session.user.id
          : null,
      metadata: {
        ...properties,
        ipAddress: requestIp(request),
        userAgent: request.headers.get("user-agent"),
      },
      source: "browser",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
