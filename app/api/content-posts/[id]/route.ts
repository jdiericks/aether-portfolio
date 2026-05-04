import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(baseSlug: string, currentId: string) {
  let slug = baseSlug;
  let index = 2;
  while (await prisma.contentPost.findFirst({ where: { slug, id: { not: currentId } } })) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  return slug;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = cleanString(body.title);
      if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      data.title = title;
    }
    if (body.slug !== undefined) {
      const slug = slugify(cleanString(body.slug) || String(data.title || ""));
      if (slug) data.slug = await uniqueSlug(slug, id);
    }
    if (body.excerpt !== undefined) {
      data.excerpt = cleanString(body.excerpt);
      data.description = cleanString(body.description) || cleanString(body.excerpt);
    }
    if (body.description !== undefined) data.description = cleanString(body.description);
    if (body.category !== undefined) data.category = cleanString(body.category);
    if (body.authorName !== undefined) data.authorName = cleanString(body.authorName);
    if (body.imageUrl !== undefined) data.imageUrl = cleanString(body.imageUrl);
    if (body.body !== undefined) data.body = cleanString(body.body) || "";
    if (body.status !== undefined) data.status = cleanString(body.status) || "draft";
    if (body.metaTitle !== undefined || body.seoTitle !== undefined) {
      data.metaTitle = cleanString(body.metaTitle ?? body.seoTitle);
    }
    if (body.metaDescription !== undefined || body.seoDescription !== undefined) {
      data.metaDescription = cleanString(body.metaDescription ?? body.seoDescription);
    }
    if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

    const post = await prisma.contentPost.update({ where: { id }, data });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating content post:", error);
    return NextResponse.json({ error: "Failed to update content post" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const { id } = await params;
    await prisma.contentPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting content post:", error);
    return NextResponse.json({ error: "Failed to delete content post" }, { status: 500 });
  }
}
