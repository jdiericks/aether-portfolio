import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { buildOtpAuthUrl, generateTotpSecret } from "@/lib/totp";
import { getEmailBranding } from "@/lib/email";

/**
 * Begin 2FA enrollment. Generates a fresh TOTP secret, stores it on the user,
 * and returns the otpauth URL plus a base64-encoded QR-code data URI.
 *
 * Calling this on a user who has already enabled 2FA returns 400 — they need
 * to disable first.
 */
export async function POST() {
  const result = await requireAdmin();
  if (result.error) return result.error;

  const user = await prisma.user.findUnique({
    where: { id: result.admin.userId },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.totpEnabled) {
    return NextResponse.json(
      { error: "2FA is already enabled. Disable it first to re-enroll." },
      { status: 400 },
    );
  }

  const secret = generateTotpSecret();
  const branding = await getEmailBranding();
  const otpauthUrl = buildOtpAuthUrl({
    secret,
    email: user.email,
    issuer: branding.productName || branding.brandName || "Aether",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const qrDataUri = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });

  return NextResponse.json({
    secret,
    otpauthUrl,
    qrDataUri,
    issuer: branding.productName || branding.brandName,
  });
}
