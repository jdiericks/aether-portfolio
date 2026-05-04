import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { registerTools } from "./tools.js";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Auth-gated MCP server for stdio transport
//
// Uses a Proxy on Prisma to reject all queries when not authenticated.
// The authenticate/check_auth/logout tools bypass this gate.
// ---------------------------------------------------------------------------

const session = {
  authenticated: false,
  adminId: null as string | null,
  adminEmail: null as string | null,
  adminName: null as string | null,
  authenticatedAt: null as Date | null,
  failedAttempts: 0,
  lockedUntil: null as Date | null,
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const gatedPrisma = new Proxy(prisma, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === "object" && val !== null && !session.authenticated) {
      const modelNames = [
        "client",
        "photo",
        "portfolioPhoto",
        "siteContent",
        "contactSubmission",
        "user",
      ];
      if (modelNames.includes(prop as string)) {
        return new Proxy(val, {
          get() {
            throw new Error(
              "NOT_AUTHENTICATED: Call the 'authenticate' tool with your admin email and password first.",
            );
          },
        });
      }
    }
    return val;
  },
}) as PrismaClient;

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "real-estate-admin",
  version: "1.0.0",
});

// Auth tools — always work regardless of session state

server.tool(
  "authenticate",
  "Authenticate with admin email and password. Required before using any other tool.",
  {
    email: z.string().describe("Admin email"),
    password: z.string().describe("Admin password"),
  },
  async ({ email, password }) => {
    if (session.lockedUntil && new Date() < session.lockedUntil) {
      const mins = Math.ceil(
        (session.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: Locked for ${mins} minute(s) due to failed attempts.`,
          },
        ],
        isError: true,
      };
    }

    const admin = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      session.failedAttempts++;
      if (session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        session.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        session.failedAttempts = 0;
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Too many failed attempts. Locked for 15 minutes.",
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: Invalid credentials. ${MAX_FAILED_ATTEMPTS - session.failedAttempts} attempt(s) left.`,
          },
        ],
        isError: true,
      };
    }

    session.authenticated = true;
    session.adminId = admin.id;
    session.adminEmail = admin.email;
    session.adminName = admin.name;
    session.authenticatedAt = new Date();
    session.failedAttempts = 0;
    session.lockedUntil = null;

    return {
      content: [
        {
          type: "text" as const,
          text: `Authenticated as "${admin.name}" (${admin.email}). All tools are now available.`,
        },
      ],
    };
  },
);

server.tool("check_auth", "Check current authentication status", async () => {
  if (!session.authenticated) {
    return {
      content: [{ type: "text" as const, text: "Not authenticated." }],
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            authenticated: true,
            admin: { name: session.adminName, email: session.adminEmail },
            authenticatedAt: session.authenticatedAt?.toISOString(),
          },
          null,
          2,
        ),
      },
    ],
  };
});

server.tool("logout", "End the current session", async () => {
  const was = session.authenticated;
  session.authenticated = false;
  session.adminId = null;
  session.adminEmail = null;
  session.adminName = null;
  session.authenticatedAt = null;
  return {
    content: [
      {
        type: "text" as const,
        text: was
          ? "Logged out. Re-authenticate to use admin tools."
          : "No active session.",
      },
    ],
  };
});

// Register all admin tools — they use gatedPrisma which throws when not authenticated
registerTools(server, gatedPrisma);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Real Estate Admin MCP server running on stdio");
  console.error("Call 'authenticate' with admin credentials to begin.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
