import { prisma } from "./prisma";
import type { AuthenticatedAdmin } from "./admin-auth";

export type AuditCategory =
  | "auth"
  | "team"
  | "role"
  | "branding"
  | "website"
  | "content"
  | "listings"
  | "social"
  | "inquiries"
  | "clients"
  | "email"
  | "mcp"
  | "general";

export interface RecordAuditLogOptions {
  /** The signed-in admin performing the action. Pass null for system events. */
  actor: AuthenticatedAdmin | null;
  action: string;
  category?: AuditCategory;
  summary: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: Request | null;
}

/**
 * Best-effort persistence of an admin action to the AuditLog table. Never
 * throws — failures are logged to the console so a logging hiccup can't break
 * the actual operation.
 */
export async function recordAuditLog(opts: RecordAuditLogOptions): Promise<void> {
  try {
    const { ipAddress, userAgent } = extractRequestContext(opts.request ?? null);
    await prisma.auditLog.create({
      data: {
        actorId: opts.actor?.userId ?? null,
        actorName: opts.actor?.name ?? null,
        actorEmail: opts.actor?.email ?? null,
        action: opts.action,
        category: opts.category ?? "general",
        entityType: opts.entityType ?? null,
        entityId: opts.entityId ?? null,
        summary: opts.summary,
        metadata: (opts.metadata ?? undefined) as object | undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[audit-log] failed to record entry:", err);
  }
}

function extractRequestContext(request: Request | null): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  if (!request) return { ipAddress: null, userAgent: null };
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ipAddress =
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    headers.get("x-real-ip") ||
    null;
  const userAgent = headers.get("user-agent");
  return { ipAddress, userAgent: userAgent ? userAgent.slice(0, 500) : null };
}

// ---------------------------------------------------------------------------
// Computed diff helper for "what changed?" entries
// ---------------------------------------------------------------------------

export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  ignore: string[] = [],
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const ignoreSet = new Set(ignore);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (ignoreSet.has(key)) continue;
    const a = before[key];
    const b = after[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff[key] = { before: a, after: b };
    }
  }
  return diff;
}
