import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { generateRecoveryCodes, hashRecoveryCodes } from "@/lib/totp";
import { recordAuditLog } from "@/lib/audit-log";
import { send2faRecoveryCodesEmail } from "@/lib/email-templates";

/**
 * Regenerate the user's set of recovery codes. Old ones are invalidated
 * immediately. Returned in plain text once.
 */
export async function POST(request: Request) {
  const result = await requireAdmin();
  if (result.error) return result.error;

  const user = await prisma.user.findUnique({
    where: { id: result.admin.userId },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.totpEnabled) {
    return NextResponse.json({ error: "Enable 2FA first" }, { status: 400 });
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashes = await hashRecoveryCodes(recoveryCodes);
  await prisma.user.update({
    where: { id: user.id },
    data: { recoveryCodes: hashes },
  });

  await recordAuditLog({
    actor: result.admin,
    action: "auth.2fa.recovery_codes.regenerate",
    category: "auth",
    summary: `${user.name} regenerated 2FA recovery codes`,
    entityType: "user",
    entityId: user.id,
    request,
  });

  send2faRecoveryCodesEmail({
    to: user.email,
    recipientName: user.name,
    codes: recoveryCodes,
  }).catch((err) => console.error("[2fa] recovery code email failed:", err));

  return NextResponse.json({ ok: true, recoveryCodes });
}
