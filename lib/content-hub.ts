import { prisma } from "@/lib/prisma";
import { isUnavailablePrismaReadError } from "@/lib/prisma-errors";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function contentPostSlug(title: string) {
  return slugify(title) || `post-${Date.now()}`;
}

export async function getContentPosts({ includeDrafts = false } = {}) {
  if (!process.env.DATABASE_URL) return [];

  try {
    return await prisma.contentPost.findMany({
      where: includeDrafts ? undefined : { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });
  } catch (error) {
    if (isUnavailablePrismaReadError(error)) return [];
    throw error;
  }
}

export async function getContentPostBySlug(slug: string) {
  if (!process.env.DATABASE_URL) return null;

  try {
    return await prisma.contentPost.findUnique({ where: { slug } });
  } catch (error) {
    if (isUnavailablePrismaReadError(error)) return null;
    throw error;
  }
}
