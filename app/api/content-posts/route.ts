import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function uniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.contentPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const posts = await prisma.contentPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const baseSlug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title);

    if (!title || !baseSlug) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = await uniqueSlug(baseSlug);
    const metaTitle = cleanString(body.metaTitle) || cleanString(body.seoTitle);
    const metaDescription =
      cleanString(body.metaDescription) || cleanString(body.seoDescription);

    const post = await prisma.contentPost.create({
      data: {
        title,
        slug,
        description: cleanString(body.description) || cleanString(body.excerpt),
        excerpt: cleanString(body.excerpt),
        body: cleanString(body.body) || "",
        category: cleanString(body.category) || "Market Insight",
        authorName: cleanString(body.authorName),
        imageUrl: cleanString(body.imageUrl),
        metaTitle,
        metaDescription,
        status: body.status === "draft" ? "draft" : "published",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating content post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content post" },
      { status: 500 }
    );
  }
}
