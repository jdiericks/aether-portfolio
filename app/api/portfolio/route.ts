import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { applyWatermark } from "@/lib/watermark";
import { getSiteContent } from "@/lib/site-content";

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[/\\]/g, "-")
    .replace(/^\.+/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120) || "upload";
}

export async function GET() {
  const photos = await prisma.portfolioPhoto.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const caption = formData.get("caption");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (caption && typeof caption !== "string") {
      return NextResponse.json(
        { error: "Invalid caption" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.portfolioPhoto.aggregate({
      _max: { order: true },
    });

    const safeFilename = sanitizeFilename(file.name);

    const siteContent = await getSiteContent();
    const brandName = siteContent.brand_name || "Diericks Realty";
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const watermarkedBuffer = await applyWatermark(originalBuffer, {
      text: brandName,
    });

    const blob = await put(
      `portfolio/${Date.now()}-${safeFilename}`,
      watermarkedBuffer,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      }
    );

    const photo = await prisma.portfolioPhoto.create({
      data: {
        url: blob.url,
        blobKey: blob.url,
        filename: safeFilename,
        caption: caption?.trim() || null,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error uploading listing image:", error);
    return NextResponse.json(
      { error: "Failed to upload listing image" },
      { status: 500 }
    );
  }
}
