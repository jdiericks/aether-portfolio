import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  consumeAuthCode,
  getOAuthClient,
  createTokenPair,
  exchangeRefreshToken,
  ensureStaticClientFromEnv,
} from "@/lib/mcp/oauth-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  } else {
    body = await request.json();
  }

  const grantType = body.grant_type;
  const clientId = body.client_id;
  const clientSecret = body.client_secret;

  if (!clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing client_id" },
      { status: 400 },
    );
  }

  await ensureStaticClientFromEnv();
  const client = await getOAuthClient(clientId);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client" },
      { status: 401 },
    );
  }

  if (
    client.client_secret &&
    client.token_endpoint_auth_method !== "none" &&
    client.client_secret !== clientSecret
  ) {
    return NextResponse.json(
      { error: "invalid_client" },
      { status: 401 },
    );
  }

  if (grantType === "authorization_code") {
    const code = body.code;
    const codeVerifier = body.code_verifier;
    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing code or code_verifier" },
        { status: 400 },
      );
    }

    const codeData = await consumeAuthCode(code);
    if (!codeData) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid or expired authorization code" },
        { status: 400 },
      );
    }

    if (codeData.clientId !== clientId) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Code was not issued to this client" },
        { status: 400 },
      );
    }

    const expectedChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    if (expectedChallenge !== codeData.params.codeChallenge) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "PKCE verification failed" },
        { status: 400 },
      );
    }

    const tokens = await createTokenPair(
      clientId,
      codeData.adminId,
      codeData.params.scopes ?? [],
      codeData.params.resource?.toString(),
    );
    return NextResponse.json(tokens);
  }

  if (grantType === "refresh_token") {
    const refreshToken = body.refresh_token;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing refresh_token" },
        { status: 400 },
      );
    }

    try {
      const tokens = await exchangeRefreshToken(
        clientId,
        refreshToken,
        body.scope ? body.scope.split(" ") : undefined,
      );
      return NextResponse.json(tokens);
    } catch (e) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: (e as Error).message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400 },
  );
}
