import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateSlug(title: string, address: string) {
  const base = `${title}-${address}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
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

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parsePriceAmount(value: string) {
  const number = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalGallery(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const media = item as Record<string, unknown>;
      return {
        type: media.type === "video" ? "video" : "image",
        url: optionalString(media.url) || "",
        alt: optionalString(media.alt),
      };
    })
    .filter((item) => item.url);
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const listings = await prisma.listing.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const title = optionalString(body.title);
    const address = optionalString(body.address);
    const price = optionalString(body.price);

    if (!title || !address || !price) {
      return NextResponse.json(
        { error: "Title, address, and price are required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        slug: generateSlug(title, address),
        address,
        city: optionalString(body.city),
        state: optionalString(body.state),
        neighborhood: optionalString(body.neighborhood),
        municipality: optionalString(body.municipality),
        postalCode: optionalString(body.postalCode),
        country: optionalString(body.country) ?? "MX",
        price,
        priceAmount: parsePriceAmount(price),
        priceCurrency: optionalString(body.priceCurrency) ?? "USD",
        beds: optionalNumber(body.beds),
        baths: optionalNumber(body.baths),
        squareFeet: optionalNumber(body.squareFeet),
        latitude: optionalNumber(body.latitude),
        longitude: optionalNumber(body.longitude),
        lotSize: optionalString(body.lotSize),
        status: optionalString(body.status) ?? "active",
        description: optionalString(body.description),
        imageUrl: optionalString(body.imageUrl),
        videoUrl: optionalString(body.videoUrl),
        gallery: optionalGallery(body.gallery),
        agentName: optionalString(body.agentName),
        agentTitle: optionalString(body.agentTitle),
        agentEmail: optionalString(body.agentEmail),
        agentPhone: optionalString(body.agentPhone),
        agentWhatsapp: optionalString(body.agentWhatsapp),
        agentPhotoUrl: optionalString(body.agentPhotoUrl),
        facebookUrl: optionalString(body.facebookUrl),
        instagramUrl: optionalString(body.instagramUrl),
        isFeatured: body.isFeatured === undefined ? true : body.isFeatured === true,
        order: optionalNumber(body.order) ?? 0,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
