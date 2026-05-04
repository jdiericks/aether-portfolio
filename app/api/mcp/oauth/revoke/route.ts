import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/mcp/oauth-store";

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

  const token = body.token;
  if (!token) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing token" },
      { status: 400 },
    );
  }

  await revokeToken({ token });
  return new NextResponse(null, { status: 200 });
}
