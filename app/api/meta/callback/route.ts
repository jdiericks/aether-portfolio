import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exchangeMetaCode, loadMetaAccountData } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("meta_oauth_state")?.value;
  cookieStore.delete("meta_oauth_state");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/integrations?meta_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/admin/integrations?meta_error=invalid_state", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/integrations?meta_error=missing_code", request.url));
  }

  try {
    const token = await exchangeMetaCode(code);
    const { me, pages } = await loadMetaAccountData(token.access_token);

    await prisma.metaConnection.deleteMany();
    await prisma.metaConnection.create({
      data: {
        providerUserId: me.id,
        providerUserName: me.name,
        accessToken: token.access_token,
        tokenType: token.token_type,
        expiresAt: token.expires_in
          ? new Date(Date.now() + token.expires_in * 1000)
          : null,
        pages: pages as unknown as Prisma.InputJsonValue,
        instagramAccounts: [],
        selectedPageId: pages[0]?.id || null,
        selectedInstagramId: null,
      },
    });

    return NextResponse.redirect(new URL("/admin/integrations?meta_connected=1", request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "meta_callback_failed";
    return NextResponse.redirect(
      new URL(`/admin/integrations?meta_error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
