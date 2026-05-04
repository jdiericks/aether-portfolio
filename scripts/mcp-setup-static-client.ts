/**
 * Sets up a static MCP OAuth client in the database.
 * Run this once after deploying to Vercel to register the OAuth client
 * that Claude (or other MCP clients) will use.
 *
 * Usage: npx tsx scripts/mcp-setup-static-client.ts
 *
 * Environment variables:
 *   MCP_OAUTH_CLIENT_ID     - Client ID (defaults to auto-generated)
 *   MCP_OAUTH_CLIENT_SECRET - Client secret (optional)
 *   DATABASE_URL             - PostgreSQL connection string
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

async function main() {
  const prisma = new PrismaClient();

  const clientId = process.env.MCP_OAUTH_CLIENT_ID || `mcp_${randomUUID()}`;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET || undefined;

  const existing = await prisma.mcpOAuthClient.findUnique({
    where: { clientId },
  });

  if (existing) {
    console.log(`OAuth client already exists: ${clientId}`);
    await prisma.$disconnect();
    return;
  }

  await prisma.mcpOAuthClient.create({
    data: {
      clientId,
      clientSecret: clientSecret ?? null,
      redirectUris: [
        "https://claude.ai/api/mcp/auth_callback",
        "http://localhost:3000/api/auth/callback",
      ],
      tokenEndpointAuthMethod: clientSecret
        ? "client_secret_post"
        : "none",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
      clientName: "MCP Client",
    },
  });

  console.log("MCP OAuth client created:");
  console.log(`  Client ID:     ${clientId}`);
  console.log(`  Client Secret: ${clientSecret ?? "(none)"}`);
  console.log("");
  console.log("Set these as environment variables on Vercel:");
  console.log(`  MCP_OAUTH_CLIENT_ID=${clientId}`);
  if (clientSecret) {
    console.log(`  MCP_OAUTH_CLIENT_SECRET=${clientSecret}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
