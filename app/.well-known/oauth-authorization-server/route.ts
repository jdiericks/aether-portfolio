import { NextResponse } from "next/server";
import { getMcpBaseUrl } from "@/lib/mcp/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getMcpBaseUrl();

  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    registration_endpoint: `${baseUrl}/api/mcp/oauth/register`,
    revocation_endpoint: `${baseUrl}/api/mcp/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "none",
    ],
    scopes_supported: ["admin"],
    code_challenge_methods_supported: ["S256"],
  });
}
