import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { generateRecoveryCodes, hashRecoveryCodes, verifyTotpCode } from "@/lib/totp";
import { recordAuditLog } from "@/lib/audit-log";
import { send2faRecoveryCodesEmail } from "@/lib/email-templates";

/**
 * Confirm and enable 2FA. Caller submits a 6-digit code from their authenticator
 * app; if it verifies against the pending secret, 2FA is turned on and a fresh
 * set of recovery codes is generated. The recovery codes are returned in plain
 * text *once* — the server only stores bcrypt hashes.
 */
export async function POST(request: Request) {
  const result = await requireAdmin();
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";

  const user = await prisma.user.findUnique({
    where: { id: result.admin.userId },
  });
  if (!user || !user.totpSecret) {
    return NextResponse.json(
      { error: "No pending 2FA setup. Start over from Account Settings." },
      { status: 400 },
    );
  }

  if (!verifyTotpCode(code, user.totpSecret)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashes = await hashRecoveryCodes(recoveryCodes);

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true, recoveryCodes: hashes },
  });

  await recordAuditLog({
    actor: result.admin,
    action: "auth.2fa.enable",
    category: "auth",
    summary: `${user.name} enabled two-factor authentication`,
    entityType: "user",
    entityId: user.id,
    request,
  });

  // Email a backup copy. Best-effort.
  send2faRecoveryCodesEmail({
    to: user.email,
    recipientName: user.name,
    codes: recoveryCodes,
  }).catch((err) => console.error("[2fa] recovery code email failed:", err));

  return NextResponse.json({ ok: true, recoveryCodes });
}
