import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const photos = await prisma.photo.findMany({
      where: {
        client: {
          id: session.user.id,
          isActive: true,
        },
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        url: true,
        filename: true,
        width: true,
        height: true,
      },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching client photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
