import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      include: {
        photos: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.photos.length === 0) {
      return NextResponse.json(
        { error: "No photos to download" },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    const downloadPromises = client.photos.map(async (photo, index) => {
      try {
        const response = await fetch(photo.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${photo.filename}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const paddedIndex = String(index + 1).padStart(3, "0");
        const filename = `${paddedIndex}-${photo.filename}`;
        zip.file(filename, arrayBuffer);
      } catch (error) {
        console.error(`Failed to download ${photo.filename}:`, error);
      }
    });

    await Promise.all(downloadPromises);

    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "STORE",
    });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${client.name}-photos.zip"`,
      },
    });
  } catch (error) {
    console.error("Error creating zip:", error);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 }
    );
  }
}
