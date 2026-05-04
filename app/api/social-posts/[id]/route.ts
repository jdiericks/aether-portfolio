import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.platform !== undefined) updateData.platform = cleanString(body.platform) || "facebook";
  if (body.status !== undefined) updateData.status = cleanString(body.status) || "draft";
  if (body.caption !== undefined) updateData.caption = cleanString(body.caption) || "";
  if (body.hashtags !== undefined) updateData.hashtags = stringArray(body.hashtags) || [];
  if (body.mediaUrls !== undefined) updateData.mediaUrls = stringArray(body.mediaUrls) || [];
  if (body.targetPageId !== undefined) updateData.targetPageId = cleanString(body.targetPageId);
  if (body.targetAccountId !== undefined) updateData.targetAccountId = cleanString(body.targetAccountId);
  if (body.publishedUrl !== undefined) updateData.publishedUrl = cleanString(body.publishedUrl);
  if (body.scheduledFor !== undefined) {
    updateData.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
  }
  if (body.publishedAt !== undefined) {
    updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
  }

  try {
    const post = await prisma.socialPost.update({
      where: { id },
      data: updateData,
      include: { listing: true },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating social post:", error);
    return NextResponse.json({ error: "Failed to update social post" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.socialPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social post:", error);
    return NextResponse.json({ error: "Failed to delete social post" }, { status: 500 });
  }
}
