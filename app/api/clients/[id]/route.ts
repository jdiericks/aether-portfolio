import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { del } from "@vercel/blob";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      isActive: true,
      packageType: true,
      projectStatus: true,
      interestSummary: true,
      sellerReport: true,
      createdAt: true,
      updatedAt: true,
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
      photos: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          url: true,
          filename: true,
          order: true,
          width: true,
          height: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      isActive,
      packageType,
      projectStatus,
      interestSummary,
      sellerReport,
      listingIds,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (email === null || email === "") {
        updateData.email = null;
      } else if (typeof email === "string") {
        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }
        updateData.email = normalizedEmail;
      } else {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json({ error: "Invalid isActive value" }, { status: 400 });
      }
      updateData.isActive = isActive;
    }

    if (password) {
      if (typeof password !== "string") {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (packageType !== undefined) {
      if (packageType !== "buyer" && packageType !== "seller") {
        return NextResponse.json({ error: "Invalid package type" }, { status: 400 });
      }
      updateData.packageType = packageType;
    }

    if (projectStatus !== undefined) {
      if (typeof projectStatus !== "string" || !projectStatus.trim()) {
        return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
      }
      updateData.projectStatus = projectStatus.trim();
    }

    if (interestSummary !== undefined) {
      updateData.interestSummary =
        typeof interestSummary === "string" && interestSummary.trim()
          ? interestSummary.trim()
          : null;
    }

    if (sellerReport !== undefined) {
      updateData.sellerReport =
        typeof sellerReport === "string" && sellerReport.trim()
          ? sellerReport.trim()
          : null;
    }

    if (listingIds !== undefined && !Array.isArray(listingIds)) {
      return NextResponse.json({ error: "listingIds must be an array" }, { status: 400 });
    }

    const client = await prisma.$transaction(async (tx) => {
      if (listingIds !== undefined) {
        const stringListingIds = (listingIds as unknown[]).filter(
          (listingId): listingId is string => typeof listingId === "string"
        );
        const normalizedIds = [...new Set<string>(stringListingIds)];
        await tx.clientListing.deleteMany({ where: { clientId: id } });
        if (normalizedIds.length > 0) {
          await tx.clientListing.createMany({
            data: normalizedIds.map((listingId, order) => ({
              clientId: id,
              listingId,
              order,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.client.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          slug: true,
          isActive: true,
          packageType: true,
          projectStatus: true,
          interestSummary: true,
          sellerReport: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const photos = await prisma.photo.findMany({
      where: { clientId: id },
    });

    for (const photo of photos) {
      try {
        await del(photo.url);
      } catch {
        console.error("Failed to delete blob:", photo.blobKey);
      }
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
