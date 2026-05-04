import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120) || "upload";
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
    const clientId = formData.get("clientId");

    if (!(file instanceof File) || typeof clientId !== "string" || !clientId) {
      return NextResponse.json(
        { error: "File and clientId are required" },
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

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const maxOrder = await prisma.photo.aggregate({
      where: { clientId },
      _max: { order: true },
    });

    const safeFilename = sanitizeFilename(file.name);
    const blob = await put(`clients/${clientId}/${Date.now()}-${safeFilename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });

    const photo = await prisma.photo.create({
      data: {
        clientId,
        url: blob.url,
        blobKey: blob.url,
        filename: safeFilename,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
