import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  const admin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name,
      password: hashedPassword,
    },
    create: {
      email: normalizedEmail,
      name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  console.log(`Admin account is ready: ${admin.email} (${admin.name})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
