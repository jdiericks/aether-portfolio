import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { registerOAuthClient } from "@/lib/mcp/oauth-store";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const clientId = `dyn_${randomUUID()}`;
  const metadata: OAuthClientInformationFull = {
    client_id: clientId,
    client_secret: body.client_secret,
    redirect_uris: body.redirect_uris ?? [],
    token_endpoint_auth_method:
      body.token_endpoint_auth_method ?? "client_secret_post",
    grant_types: body.grant_types ?? ["authorization_code", "refresh_token"],
    response_types: body.response_types ?? ["code"],
    client_name: body.client_name,
  } as OAuthClientInformationFull;

  const registered = await registerOAuthClient(metadata);

  return NextResponse.json(registered, { status: 201 });
}
