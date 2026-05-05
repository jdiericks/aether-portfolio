import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { computeEffectiveAccess } from "./permissions";
import { ensureUserHasRole } from "./team-bootstrap";
import { consumeRecoveryCode, verifyTotpCode } from "./totp";
import { recordAuditLog } from "./audit-log";

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
        // Optional second-factor code (TOTP or recovery code). Submitted on
        // the login form's second step when the account has 2FA enabled.
        totpCode: { label: "Authenticator code", type: "text" },
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
            // 2FA gate. If the user has 2FA enabled they must submit either a
            // valid 6-digit TOTP code or a single-use recovery code.
            if (adminUser.totpEnabled) {
              const code = (credentials.totpCode || "").toString().trim();
              if (!code) {
                throw new Error("2FA_REQUIRED");
              }

              const isTotp = adminUser.totpSecret
                ? verifyTotpCode(code, adminUser.totpSecret)
                : false;
              let used: "totp" | "recovery" | null = isTotp ? "totp" : null;

              if (!isTotp) {
                const remaining = await consumeRecoveryCode(
                  code,
                  adminUser.recoveryCodes ?? [],
                );
                if (remaining === null) {
                  await recordAuditLog({
                    actor: null,
                    action: "auth.login.2fa_failure",
                    category: "auth",
                    summary: `Failed 2FA challenge for ${adminUser.email}`,
                    entityType: "user",
                    entityId: adminUser.id,
                    metadata: { email: adminUser.email },
                  });
                  throw new Error("2FA_INVALID");
                }
                await prisma.user.update({
                  where: { id: adminUser.id },
                  data: { recoveryCodes: remaining },
                });
                used = "recovery";
              }

              await recordAuditLog({
                actor: null,
                action: "auth.login.success",
                category: "auth",
                summary: `${adminUser.name} signed in with 2FA (${used})`,
                entityType: "user",
                entityId: adminUser.id,
                metadata: { email: adminUser.email, secondFactor: used },
              });
            } else {
              await recordAuditLog({
                actor: null,
                action: "auth.login.success",
                category: "auth",
                summary: `${adminUser.name} signed in`,
                entityType: "user",
                entityId: adminUser.id,
                metadata: { email: adminUser.email },
              });
            }

            // Self-heal: if this user has no role and there's no Owner yet
            // (pre-teams-feature install), promote them to Owner.
            const refreshed =
              (await ensureUserHasRole(adminUser.id)) ?? adminUser;
            const effective = computeEffectiveAccess(refreshed, refreshed.role);
            return {
              id: refreshed.id,
              email: refreshed.email,
              name: refreshed.name,
              role: "admin" as const,
              teamRoleId: refreshed.roleId ?? null,
              teamRoleName: refreshed.role?.name ?? null,
              isOwner: effective.isOwner,
              permissions: Array.from(effective.permissions),
            };
          }

          // Wrong password — log failure.
          await recordAuditLog({
            actor: null,
            action: "auth.login.failure",
            category: "auth",
            summary: `Failed sign-in for ${adminUser.email}`,
            entityType: "user",
            entityId: adminUser.id,
            metadata: { email: adminUser.email, reason: "bad_password" },
          });
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

      // Refresh from DB when:
      //  - explicit session update() call
      //  - admin token is missing the new permissions field (pre-teams session)
      const needsRefresh =
        token?.id &&
        token.role === "admin" &&
        (trigger === "update" || !Array.isArray(token.permissions));

      if (needsRefresh) {
        const fresh = await ensureUserHasRole(token.id as string);
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
