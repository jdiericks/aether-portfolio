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
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        packageType: true,
        projectStatus: true,
        interestSummary: true,
        sellerReport: true,
        isActive: true,
        listings: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            note: true,
            order: true,
            listing: {
              select: {
                id: true,
                title: true,
                slug: true,
                address: true,
                city: true,
                state: true,
                price: true,
                beds: true,
                baths: true,
                squareFeet: true,
                lotSize: true,
                status: true,
                description: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!client || !client.isActive) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}
