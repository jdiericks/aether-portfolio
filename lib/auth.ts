import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

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
        });

        if (adminUser) {
          const isValid = await bcrypt.compare(credentials.password, adminUser.password);
          if (isValid) {
            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: "admin" as const,
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientSlug = user.clientSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientSlug = token.clientSlug;
      }
      return session;
    },
  },
};
