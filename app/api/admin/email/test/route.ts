import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { sendTestEmail } from "@/lib/email-templates";
import { isEmailConfigured } from "@/lib/email";

export async function POST(request: Request) {
  const result = await requirePermission("integrations.manage");
  if (result.error) return result.error;

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set the RESEND_API_KEY environment variable and redeploy.",
      },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Valid recipient address required" }, { status: 400 });
  }

  const send = await sendTestEmail(to);
  if (!send.ok) {
    return NextResponse.json({ error: send.error || "Send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: send.id, skipped: send.skipped });
}
