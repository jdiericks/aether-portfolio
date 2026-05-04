import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function parsePriceAmount(price: string) {
  const number = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseGallery(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const media = item as Record<string, unknown>;
      return {
        type: media.type === "video" ? "video" : "image",
        url: cleanString(media.url) || "",
        alt: cleanString(media.alt),
      };
    })
    .filter((item) => item.url);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = cleanString(body.title);
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    updateData.title = title;
  }

  if (body.address !== undefined) {
    const address = cleanString(body.address);
    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }
    updateData.address = address;
  }

  if (body.price !== undefined) {
    const price = cleanString(body.price);
    if (!price) {
      return NextResponse.json({ error: "Price is required" }, { status: 400 });
    }
    updateData.price = price;
    updateData.priceAmount = parsePriceAmount(price);
  }

  if (body.city !== undefined) updateData.city = cleanString(body.city);
  if (body.state !== undefined) updateData.state = cleanString(body.state);
  if (body.priceCurrency !== undefined) {
    const currency = cleanString(body.priceCurrency);
    updateData.priceCurrency = currency === "MXN" ? "MXN" : "USD";
  }
  if (body.neighborhood !== undefined) updateData.neighborhood = cleanString(body.neighborhood);
  if (body.municipality !== undefined) updateData.municipality = cleanString(body.municipality);
  if (body.postalCode !== undefined) updateData.postalCode = cleanString(body.postalCode);
  if (body.country !== undefined) updateData.country = cleanString(body.country) || "MX";
  if (body.lotSize !== undefined) updateData.lotSize = cleanString(body.lotSize);
  if (body.description !== undefined) updateData.description = cleanString(body.description);
  if (body.imageUrl !== undefined) updateData.imageUrl = cleanString(body.imageUrl);
  if (body.agentName !== undefined) updateData.agentName = cleanString(body.agentName);
  if (body.agentTitle !== undefined) updateData.agentTitle = cleanString(body.agentTitle);
  if (body.agentEmail !== undefined) updateData.agentEmail = cleanString(body.agentEmail);
  if (body.agentPhone !== undefined) updateData.agentPhone = cleanString(body.agentPhone);
  if (body.agentWhatsapp !== undefined) updateData.agentWhatsapp = cleanString(body.agentWhatsapp);
  if (body.agentPhotoUrl !== undefined) updateData.agentPhotoUrl = cleanString(body.agentPhotoUrl);
  if (body.facebookUrl !== undefined) updateData.facebookUrl = cleanString(body.facebookUrl);
  if (body.instagramUrl !== undefined) updateData.instagramUrl = cleanString(body.instagramUrl);
  if (body.videoUrl !== undefined) updateData.videoUrl = cleanString(body.videoUrl);
  if (body.gallery !== undefined) updateData.gallery = parseGallery(body.gallery);

  if (body.status !== undefined) {
    const status = cleanString(body.status);
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }
    updateData.status = status;
  }

  if (body.beds !== undefined) updateData.beds = body.beds === null ? null : Number(body.beds);
  if (body.baths !== undefined) updateData.baths = body.baths === null ? null : Number(body.baths);
  if (body.squareFeet !== undefined) {
    updateData.squareFeet = body.squareFeet === null ? null : Number(body.squareFeet);
  }
  if (body.latitude !== undefined) updateData.latitude = body.latitude === null ? null : Number(body.latitude);
  if (body.longitude !== undefined) updateData.longitude = body.longitude === null ? null : Number(body.longitude);
  if (body.order !== undefined) updateData.order = Number(body.order);
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured === true;

  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
