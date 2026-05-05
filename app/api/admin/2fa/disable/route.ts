import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAuditLog } from "@/lib/audit-log";

/**
 * Disable 2FA on the current admin. Requires the account password as
 * confirmation so a stolen session can't silently turn off 2FA.
 */
export async function POST(request: Request) {
  const result = await requireAdmin();
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: result.admin.userId },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.totpEnabled) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null, recoveryCodes: [] },
  });

  await recordAuditLog({
    actor: result.admin,
    action: "auth.2fa.disable",
    category: "auth",
    summary: `${user.name} disabled two-factor authentication`,
    entityType: "user",
    entityId: user.id,
    request,
  });

  return NextResponse.json({ ok: true });
}
