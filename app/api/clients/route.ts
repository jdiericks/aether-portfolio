import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).substring(2, 8);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      packageType: true,
      projectStatus: true,
      interestSummary: true,
      sellerReport: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { photos: true },
      },
    },
  });

  return NextResponse.json(clients);
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
    const body = await request.json();
    const {
      name,
      email,
      password,
      packageType,
      projectStatus,
      interestSummary,
      sellerReport,
      listingIds,
    } = body;

    if (typeof name !== "string" || typeof password !== "string" || !name.trim() || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const normalizedName = name.trim();
    const normalizedEmail =
      typeof email === "string" && email.trim().length > 0
        ? email.trim().toLowerCase()
        : null;

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const slug = generateSlug(normalizedName);

    const normalizedPackageType = packageType === "seller" ? "seller" : "buyer";
    const selectedListingIds = Array.isArray(listingIds)
      ? listingIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];

    const client = await prisma.client.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        packageType: normalizedPackageType,
        projectStatus:
          typeof projectStatus === "string" && projectStatus.trim()
            ? projectStatus.trim()
            : normalizedPackageType === "seller"
              ? "Preparing listing"
              : "Curating properties",
        interestSummary:
          typeof interestSummary === "string" && interestSummary.trim()
            ? interestSummary.trim()
            : null,
        sellerReport:
          typeof sellerReport === "string" && sellerReport.trim()
            ? sellerReport.trim()
            : null,
        slug,
        listings:
          selectedListingIds.length > 0
            ? {
                create: selectedListingIds.map((listingId, order) => ({
                  listingId,
                  order,
                })),
              }
            : undefined,
      },
    });

    return NextResponse.json(
      {
        id: client.id,
        name: client.name,
        email: client.email,
        slug: client.slug,
        packageType: client.packageType,
        projectStatus: client.projectStatus,
        interestSummary: client.interestSummary,
        sellerReport: client.sellerReport,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
