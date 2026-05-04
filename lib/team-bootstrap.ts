import { prisma } from "./prisma";
import { DEFAULT_ROLES } from "./permissions";

let rolesEnsured = false;

/**
 * Ensures the default roles (Owner / Admin / Editor / Member) exist. Idempotent
 * and cached for the lifetime of the process. Safe to call from the auth flow
 * on every login.
 */
export async function ensureDefaultRoles() {
  if (rolesEnsured) return;
  for (const seed of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: seed.name },
      update: {
        // Don't overwrite admin-customized permissions on existing roles.
        // We only refresh the metadata that should always reflect the seed.
        description: seed.description,
        isSystem: seed.isSystem,
        isOwner: seed.isOwner,
      },
      create: {
        name: seed.name,
        description: seed.description,
        isSystem: seed.isSystem,
        isOwner: seed.isOwner,
        permissions: seed.permissions,
        mcpAccess: seed.mcpAccess,
      },
    });
  }
  rolesEnsured = true;
}

/**
 * Ensures a User has a role assigned. If they don't, and there is currently
 * no Owner in the system, promote them to Owner. This makes the upgrade path
 * zero-touch for sites that had a single admin user before the teams feature
 * was introduced.
 *
 * Returns the (possibly updated) user with their role loaded.
 */
export async function ensureUserHasRole(userId: string) {
  await ensureDefaultRoles();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user) return null;
  if (user.role) return user;

  const ownerCount = await prisma.user.count({
    where: { role: { isOwner: true } },
  });

  if (ownerCount === 0) {
    const ownerRole = await prisma.role.findUnique({ where: { name: "Owner" } });
    if (ownerRole) {
      return prisma.user.update({
        where: { id: userId },
        data: { roleId: ownerRole.id },
        include: { role: true },
      });
    }
  }

  return user;
}
