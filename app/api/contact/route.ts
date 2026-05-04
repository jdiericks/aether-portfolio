import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTrackingEvent } from "@/lib/tracking";

const MAX_TEXT_LENGTH = 5_000;
const MAX_FIELD_LENGTH = 250;

function cleanText(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, eventType, eventDate, message, listingTitle, listingSlug } = body;
    const cleanName = cleanText(name);
    const cleanEmail = cleanText(email).toLowerCase();
    const cleanMessage = cleanText(message, MAX_TEXT_LENGTH);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const cleanListingTitle = cleanText(listingTitle);
    const cleanListingSlug = cleanText(listingSlug);
    const listingContext =
      cleanListingTitle
        ? `Listing: ${cleanListingTitle}${cleanListingSlug ? ` (${cleanListingSlug})` : ""}\n\n`
        : "";

    const submission = await prisma.contactSubmission.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        eventType: cleanText(eventType) || null,
        eventDate: cleanText(eventDate) || null,
        message: `${listingContext}${cleanMessage}`,
      },
    });

    await createTrackingEvent({
      eventName: cleanListingSlug ? "listing_inquiry_submit" : "contact_form_submit",
      source: "server",
      sessionId:
        typeof body.sessionId === "string" && body.sessionId.trim()
          ? body.sessionId.trim().slice(0, 120)
          : null,
      listingSlug: cleanListingSlug || null,
      metadata: {
        submissionId: submission.id,
        visitorId:
          typeof body.visitorId === "string" && body.visitorId.trim()
            ? body.visitorId.trim().slice(0, 100)
            : null,
        eventType: cleanText(eventType) || null,
        hasPhone: Boolean(cleanText(eventDate)),
      },
    });

    return NextResponse.json(
      { success: true, id: submission.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact submission:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
