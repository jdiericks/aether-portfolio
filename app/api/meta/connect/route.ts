import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaConnectUrl, getMetaConfig } from "@/lib/meta";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appId, redirectUri } = getMetaConfig();
  if (!appId || !redirectUri) {
    return NextResponse.json(
      { error: "META_APP_ID and META_REDIRECT_URI are required" },
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  const connectUrl = getMetaConnectUrl(state);
  if (!connectUrl) {
    return NextResponse.json(
      { error: "Meta OAuth is not configured" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(connectUrl);
}
