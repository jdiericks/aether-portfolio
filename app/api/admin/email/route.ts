import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content";
import { isEmailConfigured } from "@/lib/email";

const EMAIL_KEYS = [
  "email_from_name",
  "email_from_address",
  "email_reply_to",
  "email_notification_recipient",
  "email_send_inquiry_notifications",
  "email_send_audit_confirmations",
  "email_send_team_invites",
] as const;

type EmailKey = (typeof EMAIL_KEYS)[number];

async function loadAllContent() {
  const rows = await prisma.siteContent.findMany();
  const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
  for (const row of rows) content[row.key] = row.value;
  return content;
}

function pickEmailSettings(content: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const key of EMAIL_KEYS) {
    out[key] = content[key] ?? SITE_CONTENT_DEFAULTS[key] ?? "";
  }
  return out;
}

export async function GET() {
  const result = await requirePermission("integrations.manage");
  if (result.error) return result.error;
  const content = await loadAllContent();
  return NextResponse.json({
    settings: pickEmailSettings(content),
    configured: isEmailConfigured(),
  });
}

export async function PATCH(request: Request) {
  const result = await requirePermission("integrations.manage");
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!EMAIL_KEYS.includes(key as EmailKey)) continue;
    if (typeof value !== "string") continue;
    updates.push({ key, value });
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(({ key, value }) =>
        prisma.siteContent.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
  }

  const content = await loadAllContent();
  return NextResponse.json({
    settings: pickEmailSettings(content),
    configured: isEmailConfigured(),
  });
}
