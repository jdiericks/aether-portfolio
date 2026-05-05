import { NextRequest, NextResponse } from "next/server";
import { loginPage } from "@/lib/mcp/login-page";
import { getMcpBaseUrl } from "@/lib/mcp/config";
import {
  consumePendingAuth,
  createAuthCode,
  verifyAdminCredentials,
  getOAuthClient,
  createPendingAuth,
} from "@/lib/mcp/oauth-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const pendingId = formData.get("pending_id") as string | null;
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const baseUrl = getMcpBaseUrl();
  const callbackUrl = `${baseUrl}/api/mcp/oauth/authorize/callback`;

  if (!pendingId || !email || !password) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const pending = await consumePendingAuth(pendingId);
  if (!pending) {
    const html = loginPage(
      pendingId,
      callbackUrl,
      "Session expired. Please try connecting again from Claude.",
    );
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const result = await verifyAdminCredentials(email, password);
  if ("error" in result) {
    const newPendingId = await createPendingAuth(
      pending.clientId,
      pending.params,
    );
    const message =
      result.error === "mcp_access_denied"
        ? "Your account does not have MCP access. Contact a team owner."
        : result.error === "user_disabled"
          ? "Your account is disabled."
          : "Invalid email or password.";
    const html = loginPage(newPendingId, callbackUrl, message);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  const admin = result;

  const client = await getOAuthClient(pending.clientId);
  if (!client) {
    return new NextResponse("Client no longer exists", { status: 400 });
  }

  const code = await createAuthCode(
    pending.clientId,
    admin.id,
    pending.params,
  );

  const redirectUrl = new URL(pending.params.redirectUri);
  redirectUrl.searchParams.set("code", code);
  if (pending.params.state) {
    redirectUrl.searchParams.set("state", pending.params.state);
  }

  return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
}
