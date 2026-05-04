import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

// ---------------------------------------------------------------------------
// Client store — supports both static (env-configured) and dynamic clients
// ---------------------------------------------------------------------------

export class ClientsStore implements OAuthRegisteredClientsStore {
  private clients = new Map<string, OAuthClientInformationFull>();

  constructor(staticClientId?: string, staticClientSecret?: string) {
    if (staticClientId) {
      this.clients.set(staticClientId, {
        client_id: staticClientId,
        client_secret: staticClientSecret,
        redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        client_name: "Claude AI",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      } as OAuthClientInformationFull);
    }
  }

  async getClient(clientId: string) {
    return this.clients.get(clientId);
  }

  async registerClient(clientMetadata: OAuthClientInformationFull) {
    this.clients.set(clientMetadata.client_id, clientMetadata);
    return clientMetadata;
  }
}

// ---------------------------------------------------------------------------
// Pending authorization — tracks the /authorize → login → callback flow
// ---------------------------------------------------------------------------

interface PendingAuth {
  client: OAuthClientInformationFull;
  params: AuthorizationParams;
  createdAt: number;
}

interface StoredCode {
  client: OAuthClientInformationFull;
  params: AuthorizationParams;
  adminId: string;
  createdAt: number;
}

interface StoredToken {
  token: string;
  clientId: string;
  adminId: string;
  scopes: string[];
  expiresAt: number;
  resource?: URL;
}

// ---------------------------------------------------------------------------
// OAuth Server Provider — authenticates against the admin User table
// ---------------------------------------------------------------------------

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const PENDING_AUTH_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class AdminOAuthProvider implements OAuthServerProvider {
  clientsStore: ClientsStore;

  private pendingAuths = new Map<string, PendingAuth>();
  private codes = new Map<string, StoredCode>();
  private accessTokens = new Map<string, StoredToken>();
  private refreshTokens = new Map<string, StoredToken>();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, staticClientId?: string, staticClientSecret?: string) {
    this.prisma = prisma;
    this.clientsStore = new ClientsStore(staticClientId, staticClientSecret);
  }

  // -----------------------------------------------------------------------
  // Step 1: /authorize — show login form instead of auto-redirecting
  // -----------------------------------------------------------------------

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    const pendingId = randomUUID();
    this.pendingAuths.set(pendingId, { client, params, createdAt: Date.now() });

    this.cleanupExpired();

    res.setHeader("Content-Type", "text/html");
    res.end(loginPage(pendingId));
  }

  // -----------------------------------------------------------------------
  // Called by our custom POST /authorize/login route
  // -----------------------------------------------------------------------

  async handleLogin(
    pendingId: string,
    email: string,
    password: string,
    res: Response,
  ): Promise<void> {
    const pending = this.pendingAuths.get(pendingId);

    if (!pending || Date.now() - pending.createdAt > PENDING_AUTH_TTL_MS) {
      this.pendingAuths.delete(pendingId);
      res.setHeader("Content-Type", "text/html");
      res.end(loginPage(pendingId, "Session expired. Please try connecting again from Claude."));
      return;
    }

    const admin = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.setHeader("Content-Type", "text/html");
      res.end(loginPage(pendingId, "Invalid email or password."));
      return;
    }

    this.pendingAuths.delete(pendingId);

    const code = randomUUID();
    this.codes.set(code, {
      client: pending.client,
      params: pending.params,
      adminId: admin.id,
      createdAt: Date.now(),
    });

    const redirectUrl = new URL(pending.params.redirectUri);
    redirectUrl.searchParams.set("code", code);
    if (pending.params.state) {
      redirectUrl.searchParams.set("state", pending.params.state);
    }

    res.redirect(redirectUrl.toString());
  }

  // -----------------------------------------------------------------------
  // Step 2: PKCE challenge lookup
  // -----------------------------------------------------------------------

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const codeData = this.codes.get(authorizationCode);
    if (!codeData) throw new Error("Invalid authorization code");
    return codeData.params.codeChallenge;
  }

  // -----------------------------------------------------------------------
  // Step 3: Exchange auth code for tokens
  // -----------------------------------------------------------------------

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<OAuthTokens> {
    const codeData = this.codes.get(authorizationCode);
    if (!codeData) throw new Error("Invalid authorization code");
    if (codeData.client.client_id !== client.client_id) throw new Error("Code was not issued to this client");
    if (Date.now() - codeData.createdAt > CODE_TTL_MS) {
      this.codes.delete(authorizationCode);
      throw new Error("Authorization code expired");
    }

    this.codes.delete(authorizationCode);

    const accessToken = `at_${randomUUID()}`;
    const refreshToken = `rt_${randomUUID()}`;
    const now = Date.now();

    this.accessTokens.set(accessToken, {
      token: accessToken,
      clientId: client.client_id,
      adminId: codeData.adminId,
      scopes: codeData.params.scopes || [],
      expiresAt: now + TOKEN_TTL_MS,
      resource: codeData.params.resource,
    });

    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      clientId: client.client_id,
      adminId: codeData.adminId,
      scopes: codeData.params.scopes || [],
      expiresAt: now + REFRESH_TOKEN_TTL_MS,
      resource: codeData.params.resource,
    });

    return {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: Math.floor(TOKEN_TTL_MS / 1000),
      refresh_token: refreshToken,
      scope: (codeData.params.scopes || []).join(" "),
    };
  }

  // -----------------------------------------------------------------------
  // Refresh token exchange
  // -----------------------------------------------------------------------

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
  ): Promise<OAuthTokens> {
    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData) throw new Error("Invalid refresh token");
    if (tokenData.clientId !== client.client_id) throw new Error("Refresh token was not issued to this client");
    if (Date.now() > tokenData.expiresAt) {
      this.refreshTokens.delete(refreshToken);
      throw new Error("Refresh token expired");
    }

    this.refreshTokens.delete(refreshToken);

    const newAccessToken = `at_${randomUUID()}`;
    const newRefreshToken = `rt_${randomUUID()}`;
    const now = Date.now();
    const effectiveScopes = scopes || tokenData.scopes;

    this.accessTokens.set(newAccessToken, {
      token: newAccessToken,
      clientId: client.client_id,
      adminId: tokenData.adminId,
      scopes: effectiveScopes,
      expiresAt: now + TOKEN_TTL_MS,
      resource: tokenData.resource,
    });

    this.refreshTokens.set(newRefreshToken, {
      token: newRefreshToken,
      clientId: client.client_id,
      adminId: tokenData.adminId,
      scopes: effectiveScopes,
      expiresAt: now + REFRESH_TOKEN_TTL_MS,
      resource: tokenData.resource,
    });

    return {
      access_token: newAccessToken,
      token_type: "bearer",
      expires_in: Math.floor(TOKEN_TTL_MS / 1000),
      refresh_token: newRefreshToken,
      scope: effectiveScopes.join(" "),
    };
  }

  // -----------------------------------------------------------------------
  // Token verification — called on every MCP request via Bearer auth
  // -----------------------------------------------------------------------

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const tokenData = this.accessTokens.get(token);
    if (!tokenData) throw new Error("Invalid access token");
    if (Date.now() > tokenData.expiresAt) {
      this.accessTokens.delete(token);
      throw new Error("Access token expired");
    }

    return {
      token,
      clientId: tokenData.clientId,
      scopes: tokenData.scopes,
      expiresAt: Math.floor(tokenData.expiresAt / 1000),
      resource: tokenData.resource,
    };
  }

  // -----------------------------------------------------------------------
  // Token revocation
  // -----------------------------------------------------------------------

  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    this.accessTokens.delete(request.token);
    this.refreshTokens.delete(request.token);
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  private cleanupExpired() {
    const now = Date.now();
    for (const [k, v] of this.pendingAuths) if (now - v.createdAt > PENDING_AUTH_TTL_MS) this.pendingAuths.delete(k);
    for (const [k, v] of this.codes) if (now - v.createdAt > CODE_TTL_MS) this.codes.delete(k);
    for (const [k, v] of this.accessTokens) if (now > v.expiresAt) this.accessTokens.delete(k);
    for (const [k, v] of this.refreshTokens) if (now > v.expiresAt) this.refreshTokens.delete(k);
  }
}

// ---------------------------------------------------------------------------
// Login page HTML
// ---------------------------------------------------------------------------

function loginPage(pendingId: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorize - Real Estate Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0a; color: #fafafa; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 400px; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: .25rem; }
    .subtitle { color: #a3a3a3; font-size: .875rem; margin-bottom: 1.75rem; }
    label { display: block; font-size: .875rem; font-weight: 500; margin-bottom: .375rem; color: #d4d4d4; }
    input { width: 100%; padding: .625rem .75rem; border: 1px solid #404040; border-radius: 8px; background: #0a0a0a; color: #fafafa; font-size: .875rem; margin-bottom: 1rem; outline: none; transition: border-color .15s; }
    input:focus { border-color: #737373; }
    button { width: 100%; padding: .625rem; background: #fafafa; color: #0a0a0a; border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; transition: opacity .15s; }
    button:hover { opacity: .9; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: .75rem; border-radius: 8px; font-size: .8125rem; margin-bottom: 1rem; }
    .info { color: #737373; font-size: .75rem; text-align: center; margin-top: 1.25rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Real Estate Admin</h1>
    <p class="subtitle">Sign in to authorize Claude to manage your real estate website.</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/authorize/login">
      <input type="hidden" name="pending_id" value="${pendingId}" />
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required autocomplete="email" autofocus />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required autocomplete="current-password" />
      <button type="submit">Authorize</button>
    </form>
    <p class="info">This will grant Claude access to your admin tools.</p>
  </div>
</body>
</html>`;
}
