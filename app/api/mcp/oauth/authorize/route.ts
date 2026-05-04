import { NextRequest, NextResponse } from "next/server";
import { loginPage } from "@/lib/mcp/login-page";
import { getMcpBaseUrl } from "@/lib/mcp/config";
import {
  getOAuthClient,
  createPendingAuth,
  ensureStaticClientFromEnv,
} from "@/lib/mcp/oauth-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope");

  if (!clientId || !redirectUri || !codeChallenge) {
    return new NextResponse("Missing required parameters", { status: 400 });
  }
  if (responseType !== "code") {
    return new NextResponse("Unsupported response_type", { status: 400 });
  }
  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return new NextResponse("Unsupported code_challenge_method", {
      status: 400,
    });
  }

  await ensureStaticClientFromEnv();

  const client = await getOAuthClient(clientId);
  if (!client) {
    return new NextResponse("Unknown client_id", { status: 400 });
  }

  if (
    client.redirect_uris &&
    client.redirect_uris.length > 0 &&
    !client.redirect_uris.includes(redirectUri)
  ) {
    return new NextResponse("Invalid redirect_uri", { status: 400 });
  }

  const params = {
    redirectUri,
    codeChallenge,
    state: state ?? undefined,
    scopes: scope ? scope.split(" ") : [],
  };

  const pendingId = await createPendingAuth(clientId, params);
  const baseUrl = getMcpBaseUrl();
  const html = loginPage(
    pendingId,
    `${baseUrl}/api/mcp/oauth/authorize/callback`,
  );

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
