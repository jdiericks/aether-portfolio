import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import {
  computeEffectiveAccess,
  type EffectiveAccess,
  type PermissionKey,
} from "./permissions";

export interface AuthenticatedAdmin {
  userId: string;
  email: string;
  name: string;
  effective: EffectiveAccess;
}

/**
 * Resolve the current admin session and load fresh role/MCP access from the
 * database. Returns null if the request is unauthenticated or not an admin.
 *
 * Always re-reads the role from the DB so permission/role changes take effect
 * immediately for already-issued sessions.
 */
export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  if (!user || !user.isActive) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    effective: computeEffectiveAccess(user, user.role),
  };
}

/**
 * Throwing wrapper used by API routes. Returns the admin or returns a Response
 * the route can short-circuit with.
 */
export async function requireAdmin(): Promise<
  | { admin: AuthenticatedAdmin; error?: undefined }
  | { admin?: undefined; error: Response }
> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { admin };
}

export async function requirePermission(
  permission: PermissionKey,
): Promise<
  | { admin: AuthenticatedAdmin; error?: undefined }
  | { admin?: undefined; error: Response }
> {
  const result = await requireAdmin();
  if (result.error) return result;
  if (!result.admin.effective.isOwner && !result.admin.effective.permissions.has(permission)) {
    return {
      error: new Response(
        JSON.stringify({ error: "Forbidden", required: permission }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      ),
    };
  }
  return result;
}
