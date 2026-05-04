import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateListingSocialPost, normalizePlatform } from "@/lib/social-posts";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const posts = await prisma.socialPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const platform = normalizePlatform(body.platform);
    let caption = typeof body.caption === "string" ? body.caption.trim() : "";
    let hashtags = stringArray(body.hashtags);
    let mediaUrls = stringArray(body.mediaUrls);
    const listingId = typeof body.listingId === "string" ? body.listingId : null;

    if (listingId && body.generateFromListing !== false) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
      const generated = generateListingSocialPost(listing, platform);
      caption ||= generated.caption;
      if (hashtags.length === 0) hashtags = generated.hashtags;
      if (mediaUrls.length === 0) mediaUrls = generated.mediaUrls;
    }

    if (!caption) {
      return NextResponse.json(
        { error: "Caption is required unless generating from a listing" },
        { status: 400 }
      );
    }

    const post = await prisma.socialPost.create({
      data: {
        listingId,
        platform,
        caption,
        hashtags,
        mediaUrls,
        status:
          typeof body.status === "string" && body.status.trim()
            ? body.status.trim()
            : "draft",
        targetPageId:
          typeof body.targetPageId === "string" && body.targetPageId.trim()
            ? body.targetPageId.trim()
            : null,
        targetAccountId:
          typeof body.targetAccountId === "string" && body.targetAccountId.trim()
            ? body.targetAccountId.trim()
            : null,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      },
      include: { listing: true },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json({ error: "Failed to create social post" }, { status: 500 });
  }
}
