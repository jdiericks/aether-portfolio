import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTrackingEvent } from "@/lib/tracking";
import {
  sendAuditConfirmationEmail,
  sendInquiryNotificationEmail,
} from "@/lib/email-templates";
import { getSiteContent } from "@/lib/site-content";
import { getEmailBranding } from "@/lib/email";

const MAX_TEXT_LENGTH = 5_000;
const MAX_FIELD_LENGTH = 250;

function cleanText(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      businessType,
      currentTools,
      hoursPerWeek,
      hasStructuredData,
    } = body;

    const cleanName = cleanText(name);
    const cleanEmail = cleanText(email).toLowerCase();
    const cleanBusinessType = cleanText(businessType);
    const cleanCurrentTools = cleanText(currentTools, MAX_TEXT_LENGTH);
    const cleanHoursPerWeek = cleanText(hoursPerWeek);
    const cleanStructuredData = cleanText(hasStructuredData);

    if (!cleanName || !cleanEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const messageLines = [
      "AI Readiness Audit submission",
      "",
      `Business type: ${cleanBusinessType || "(not provided)"}`,
      `Current tools: ${cleanCurrentTools || "(not provided)"}`,
      `Hours/week on marketing: ${cleanHoursPerWeek || "(not provided)"}`,
      `Has structured data: ${cleanStructuredData || "(not provided)"}`,
    ];

    const submission = await prisma.contactSubmission.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        eventType: cleanBusinessType || "AI Readiness Audit",
        eventDate: cleanHoursPerWeek || null,
        message: messageLines.join("\n"),
      },
    });

    await createTrackingEvent({
      eventName: "audit_form_submit",
      source: "server",
      sessionId:
        typeof body.sessionId === "string" && body.sessionId.trim()
          ? body.sessionId.trim().slice(0, 120)
          : null,
      metadata: {
        submissionId: submission.id,
        visitorId:
          typeof body.visitorId === "string" && body.visitorId.trim()
            ? body.visitorId.trim().slice(0, 100)
            : null,
        businessType: cleanBusinessType || null,
        hoursPerWeek: cleanHoursPerWeek || null,
        hasStructuredData: cleanStructuredData || null,
      },
    });

    // Fire-and-forget email notifications. Don't block the response on them
    // and never fail the form submission if email is misconfigured.
    void (async () => {
      try {
        const content = await getSiteContent();
        const branding = await getEmailBranding();

        if (content.email_send_audit_confirmations !== "false") {
          await sendAuditConfirmationEmail({
            to: cleanEmail,
            recipientName: cleanName,
          });
        }

        if (
          content.email_send_inquiry_notifications !== "false" &&
          branding.notificationEmail
        ) {
          const baseUrl =
            process.env.NEXTAUTH_URL ||
            new URL(request.url).origin.replace(/\/$/, "");
          await sendInquiryNotificationEmail({
            to: branding.notificationEmail,
            inquiryName: cleanName,
            inquiryEmail: cleanEmail,
            inquiryEventType: cleanBusinessType || "AI Readiness Audit",
            inquiryMessage: messageLines.join("\n"),
            adminUrl: `${baseUrl}/admin/inquiries`,
          });
        }
      } catch (err) {
        console.error("[audit] notification email failed:", err);
      }
    })();

    return NextResponse.json(
      { success: true, id: submission.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating audit submission:", error);
    return NextResponse.json(
      { error: "Failed to submit audit" },
      { status: 500 }
    );
  }
}
