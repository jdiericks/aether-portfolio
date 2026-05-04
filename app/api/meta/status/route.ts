import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadMetaAccountData } from "@/lib/meta";

function stripPageTokens(value: unknown) {
  if (!Array.isArray(value)) return value;

  return value.map((item) => {
    if (!item || typeof item !== "object") return item;
    const safePage = { ...(item as Record<string, unknown>) };
    delete safePage.access_token;
    return safePage;
  });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function pageExists(pages: unknown, pageId: string) {
  return (
    Array.isArray(pages) &&
    pages.some((page) => {
      if (!page || typeof page !== "object") return false;
      return (page as { id?: unknown }).id === pageId;
    })
  );
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  const connection = await prisma.metaConnection.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      providerUserId: true,
      providerUserName: true,
      tokenType: true,
      expiresAt: true,
      scopes: true,
      pages: true,
      selectedPageId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const safeConnection = connection
    ? {
        ...connection,
        pages: stripPageTokens(connection.pages),
      }
    : null;

  return NextResponse.json({ connected: !!connection, connection: safeConnection });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  const body = await request.json();
  const selectedPageId =
    typeof body.selectedPageId === "string" && body.selectedPageId.trim()
      ? body.selectedPageId.trim()
      : null;

  const connection = await prisma.metaConnection.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!connection) {
    return NextResponse.json({ error: "Meta is not connected" }, { status: 404 });
  }

  if (selectedPageId && !pageExists(connection.pages, selectedPageId)) {
    return NextResponse.json(
      { error: "Selected page is not available on this Meta connection" },
      { status: 400 }
    );
  }

  await prisma.metaConnection.update({
    where: { id: connection.id },
    data: { selectedPageId },
  });

  const updated = await prisma.metaConnection.findUnique({
    where: { id: connection.id },
    select: {
      id: true,
      providerUserId: true,
      providerUserName: true,
      tokenType: true,
      expiresAt: true,
      scopes: true,
      pages: true,
      selectedPageId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    connected: true,
    connection: updated
      ? {
          ...updated,
          pages: stripPageTokens(updated.pages),
        }
      : null,
  });
}

export async function POST() {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  const connection = await prisma.metaConnection.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!connection) {
    return NextResponse.json({ error: "Meta is not connected" }, { status: 404 });
  }

  const { pages } = await loadMetaAccountData(connection.accessToken);
  const selectedPageId =
    connection.selectedPageId && pageExists(pages, connection.selectedPageId)
      ? connection.selectedPageId
      : pages[0]?.id || null;

  const updated = await prisma.metaConnection.update({
    where: { id: connection.id },
    data: {
      pages: pages as unknown as Prisma.InputJsonValue,
      selectedPageId,
    },
    select: {
      id: true,
      providerUserId: true,
      providerUserName: true,
      tokenType: true,
      expiresAt: true,
      scopes: true,
      pages: true,
      selectedPageId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    connected: true,
    connection: {
      ...updated,
      pages: stripPageTokens(updated.pages),
    },
  });
}
