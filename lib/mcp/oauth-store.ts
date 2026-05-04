import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;
const PENDING_AUTH_TTL_MS = 10 * 60 * 1000;

interface AuthorizationParams {
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  scopes?: string[];
  resource?: URL;
}

// ---------------------------------------------------------------------------
// Client store
// ---------------------------------------------------------------------------

export async function getOAuthClient(
  clientId: string,
): Promise<OAuthClientInformationFull | undefined> {
  const row = await prisma.mcpOAuthClient.findUnique({
    where: { clientId },
  });
  if (!row) return undefined;
  return {
    client_id: row.clientId,
    client_secret: row.clientSecret ?? undefined,
    redirect_uris: row.redirectUris,
    token_endpoint_auth_method: row.tokenEndpointAuthMethod,
    grant_types: row.grantTypes,
    response_types: row.responseTypes,
    client_name: row.clientName ?? undefined,
    client_id_issued_at: Math.floor(row.issuedAt.getTime() / 1000),
  } as OAuthClientInformationFull;
}

export async function registerOAuthClient(
  metadata: OAuthClientInformationFull,
): Promise<OAuthClientInformationFull> {
  const row = await prisma.mcpOAuthClient.create({
    data: {
      clientId: metadata.client_id,
      clientSecret: metadata.client_secret ?? null,
      redirectUris: metadata.redirect_uris ?? [],
      tokenEndpointAuthMethod:
        metadata.token_endpoint_auth_method ?? "client_secret_post",
      grantTypes: metadata.grant_types ?? [
        "authorization_code",
        "refresh_token",
      ],
      responseTypes: metadata.response_types ?? ["code"],
      clientName: metadata.client_name ?? null,
    },
  });
  return {
    ...metadata,
    client_id_issued_at: Math.floor(row.issuedAt.getTime() / 1000),
  };
}

let staticClientInitialized = false;

export async function ensureStaticClient(
  clientId: string,
  clientSecret?: string,
) {
  if (staticClientInitialized) return;
  staticClientInitialized = true;

  const existing = await prisma.mcpOAuthClient.findUnique({
    where: { clientId },
  });
  if (existing) return;
  await prisma.mcpOAuthClient.create({
    data: {
      clientId,
      clientSecret: clientSecret ?? null,
      redirectUris: ["https://claude.ai/api/mcp/auth_callback"],
      tokenEndpointAuthMethod: clientSecret
        ? "client_secret_post"
        : "none",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
      clientName: "Claude AI",
    },
  });
}

export async function ensureStaticClientFromEnv() {
  const clientId = process.env.MCP_OAUTH_CLIENT_ID;
  if (!clientId) return;
  await ensureStaticClient(clientId, process.env.MCP_OAUTH_CLIENT_SECRET);
}

// ---------------------------------------------------------------------------
// Pending authorizations
// ---------------------------------------------------------------------------

export async function createPendingAuth(
  clientId: string,
  params: AuthorizationParams,
): Promise<string> {
  const row = await prisma.mcpOAuthPendingAuth.create({
    data: {
      clientId,
      params: params as object,
      expiresAt: new Date(Date.now() + PENDING_AUTH_TTL_MS),
    },
  });
  return row.id;
}

export async function consumePendingAuth(pendingId: string): Promise<{
  clientId: string;
  params: AuthorizationParams;
} | null> {
  const row = await prisma.mcpOAuthPendingAuth.findUnique({
    where: { id: pendingId },
  });
  if (!row || new Date() > row.expiresAt) {
    if (row) await prisma.mcpOAuthPendingAuth.delete({ where: { id: pendingId } }).catch(() => {});
    return null;
  }
  await prisma.mcpOAuthPendingAuth.delete({ where: { id: pendingId } }).catch(() => {});
  return {
    clientId: row.clientId,
    params: row.params as unknown as AuthorizationParams,
  };
}

// ---------------------------------------------------------------------------
// Authorization codes
// ---------------------------------------------------------------------------

export async function createAuthCode(
  clientId: string,
  adminId: string,
  params: AuthorizationParams,
): Promise<string> {
  const code = randomUUID();
  await prisma.mcpOAuthCode.create({
    data: {
      code,
      clientId,
      adminId,
      params: params as object,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code;
}

export async function consumeAuthCode(code: string): Promise<{
  clientId: string;
  adminId: string;
  params: AuthorizationParams;
} | null> {
  const row = await prisma.mcpOAuthCode.findUnique({ where: { code } });
  if (!row || new Date() > row.expiresAt) {
    if (row) await prisma.mcpOAuthCode.delete({ where: { id: row.id } }).catch(() => {});
    return null;
  }
  await prisma.mcpOAuthCode.delete({ where: { id: row.id } }).catch(() => {});
  return {
    clientId: row.clientId,
    adminId: row.adminId,
    params: row.params as unknown as AuthorizationParams,
  };
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

export async function createTokenPair(
  clientId: string,
  adminId: string,
  scopes: string[],
  resource?: string,
): Promise<OAuthTokens> {
  const accessToken = `at_${randomUUID()}`;
  const refreshToken = `rt_${randomUUID()}`;
  const now = Date.now();

  await prisma.$transaction([
    prisma.mcpOAuthToken.create({
      data: {
        token: accessToken,
        type: "access",
        clientId,
        adminId,
        scopes,
        resource: resource ?? null,
        expiresAt: new Date(now + TOKEN_TTL_MS),
      },
    }),
    prisma.mcpOAuthToken.create({
      data: {
        token: refreshToken,
        type: "refresh",
        clientId,
        adminId,
        scopes,
        resource: resource ?? null,
        expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: Math.floor(TOKEN_TTL_MS / 1000),
    refresh_token: refreshToken,
    scope: scopes.join(" "),
  };
}

export async function verifyAccessToken(token: string): Promise<AuthInfo> {
  const row = await prisma.mcpOAuthToken.findUnique({ where: { token } });
  if (!row || row.type !== "access") throw new Error("Invalid access token");
  if (new Date() > row.expiresAt) {
    await prisma.mcpOAuthToken.delete({ where: { id: row.id } }).catch(() => {});
    throw new Error("Access token expired");
  }
  return {
    token,
    clientId: row.clientId,
    scopes: row.scopes,
    expiresAt: Math.floor(row.expiresAt.getTime() / 1000),
  };
}

export async function exchangeRefreshToken(
  clientId: string,
  refreshToken: string,
  scopes?: string[],
): Promise<OAuthTokens> {
  const row = await prisma.mcpOAuthToken.findUnique({
    where: { token: refreshToken },
  });
  if (!row || row.type !== "refresh") throw new Error("Invalid refresh token");
  if (row.clientId !== clientId) throw new Error("Refresh token was not issued to this client");
  if (new Date() > row.expiresAt) {
    await prisma.mcpOAuthToken.delete({ where: { id: row.id } }).catch(() => {});
    throw new Error("Refresh token expired");
  }

  await prisma.mcpOAuthToken.delete({ where: { id: row.id } });

  const effectiveScopes = scopes ?? row.scopes;
  return createTokenPair(clientId, row.adminId, effectiveScopes, row.resource ?? undefined);
}

export async function revokeToken(_request: OAuthTokenRevocationRequest) {
  await prisma.mcpOAuthToken
    .delete({ where: { token: _request.token } })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Admin credential verification
// ---------------------------------------------------------------------------

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const admin = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) return null;
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return null;
  return { id: admin.id, email: admin.email, name: admin.name };
}

// ---------------------------------------------------------------------------
// Cleanup expired rows (called periodically)
// ---------------------------------------------------------------------------

export async function cleanupExpiredOAuth() {
  const now = new Date();
  await Promise.all([
    prisma.mcpOAuthPendingAuth.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.mcpOAuthCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.mcpOAuthToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}
