import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { computeEffectiveAccess } from "./permissions";

const devAuthSecret =
  process.env.NODE_ENV === "production"
    ? undefined
    : "local-development-only-change-before-deploying";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? devAuthSecret,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // First check if it's an admin user
        const adminUser = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (adminUser) {
          if (!adminUser.isActive) {
            throw new Error("Your account is currently disabled");
          }
          const isValid = await bcrypt.compare(credentials.password, adminUser.password);
          if (isValid) {
            const effective = computeEffectiveAccess(adminUser, adminUser.role);
            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: "admin" as const,
              teamRoleId: adminUser.roleId ?? null,
              teamRoleName: adminUser.role?.name ?? null,
              isOwner: effective.isOwner,
              permissions: Array.from(effective.permissions),
            };
          }
        }

        // If not admin, check if it's a client
        const client = await prisma.client.findUnique({
          where: { email: credentials.email },
        });

        if (client) {
          if (!client.isActive) {
            throw new Error("Your account is currently disabled");
          }

          const isValid = await bcrypt.compare(credentials.password, client.password);
          if (isValid) {
            return {
              id: client.id,
              email: client.email!,
              name: client.name,
              role: "client" as const,
              clientSlug: client.slug,
            };
          }
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientSlug = user.clientSlug;
        token.teamRoleId = user.teamRoleId ?? null;
        token.teamRoleName = user.teamRoleName ?? null;
        token.isOwner = user.isOwner ?? false;
        token.permissions = user.permissions ?? [];
      }

      // Refresh team-role/permissions from DB on session update or every ~60s
      // so role changes propagate without forcing re-login.
      if (trigger === "update" && token?.id && token.role === "admin") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { role: true },
        });
        if (fresh) {
          const effective = computeEffectiveAccess(fresh, fresh.role);
          token.teamRoleId = fresh.roleId ?? null;
          token.teamRoleName = fresh.role?.name ?? null;
          token.isOwner = effective.isOwner;
          token.permissions = Array.from(effective.permissions);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientSlug = token.clientSlug;
        session.user.teamRoleId = token.teamRoleId ?? null;
        session.user.teamRoleName = token.teamRoleName ?? null;
        session.user.isOwner = token.isOwner ?? false;
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
};
