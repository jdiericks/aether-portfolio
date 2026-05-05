import { generateSecret, generateURI, verifySync } from "otplib";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

/**
 * Generate a fresh base32 TOTP secret. Stored on User.totpSecret while pending
 * and again after enable() — verification just runs against this value.
 */
export function generateTotpSecret(): string {
  return generateSecret();
}

/**
 * Build the otpauth:// URL for a QR code.
 *   issuer = product/brand name (so the entry in the user's app reads
 *            "Aether: alice@example.com")
 */
export function buildOtpAuthUrl(opts: {
  secret: string;
  email: string;
  issuer: string;
}): string {
  return generateURI({
    strategy: "totp",
    issuer: opts.issuer,
    label: opts.email,
    secret: opts.secret,
  });
}

/**
 * Verify a 6-digit TOTP code against a user's secret. Returns false on any
 * verification error so a malformed input never throws. We allow a 30-second
 * epoch tolerance so a code that just rolled over still works.
 */
export function verifyTotpCode(code: string, secret: string): boolean {
  if (!code || !secret) return false;
  const trimmed = code.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  try {
    const result = verifySync({
      strategy: "totp",
      secret,
      token: trimmed,
      epochTolerance: 30,
    });
    return Boolean(result.valid);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Recovery codes
// ---------------------------------------------------------------------------

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate fresh single-use recovery codes. Returned as plain strings — we
 * persist them on User.recoveryCodes as bcrypt hashes (one entry per code).
 */
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(RECOVERY_CODE_LENGTH);
    let raw = "";
    for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
      raw += RECOVERY_ALPHABET[bytes[j] % RECOVERY_ALPHABET.length];
    }
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  const hashes: string[] = [];
  for (const code of codes) {
    hashes.push(await bcrypt.hash(normalizeRecoveryCode(code), 10));
  }
  return hashes;
}

/**
 * Try to consume a recovery code. Returns the new array of remaining hashes if
 * successful, or null if the code didn't match any entry.
 */
export async function consumeRecoveryCode(
  rawCode: string,
  hashes: string[],
): Promise<string[] | null> {
  const normalized = normalizeRecoveryCode(rawCode);
  if (!normalized) return null;
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(normalized, hashes[i])) {
      const remaining = [...hashes];
      remaining.splice(i, 1);
      return remaining;
    }
  }
  return null;
}

function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
