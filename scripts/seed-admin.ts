import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLES } from "../lib/permissions";

const prisma = new PrismaClient();

async function ensureDefaultRoles() {
  for (const seed of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: seed.name },
      update: {
        description: seed.description,
        isSystem: seed.isSystem,
        isOwner: seed.isOwner,
        // Don't overwrite admin-customized permissions if the role already
        // exists; only refresh metadata on system roles.
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
}

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  const email = process.env.ADMIN_EMAIL ?? (isProduction ? null : "admin@example.com");
  const password = process.env.ADMIN_PASSWORD ?? (isProduction ? null : "admin123");
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "Missing admin seed credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await ensureDefaultRoles();
  const ownerRole = await prisma.role.findUnique({ where: { name: "Owner" } });

  const admin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name,
      password: hashedPassword,
      // Keep existing role assignment if present, otherwise upgrade to Owner.
      ...(ownerRole ? { role: { connect: { id: ownerRole.id } } } : {}),
    },
    create: {
      email: normalizedEmail,
      name,
      password: hashedPassword,
      ...(ownerRole ? { role: { connect: { id: ownerRole.id } } } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: { select: { name: true } },
    },
  });

  // If an admin existed before the teams feature, ensure they have the Owner
  // role so they don't get locked out of admin pages.
  if (ownerRole) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { roleId: ownerRole.id },
    });
  }

  console.log(`Admin account is ready: ${admin.email} (${admin.name}) [${admin.role?.name ?? "no role"}]`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
