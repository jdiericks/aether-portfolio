import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanInteger(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(testimonials);
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const name = cleanString(body.name);
    const quote = cleanString(body.quote);

    if (!name || !quote) {
      return NextResponse.json({ error: "Name and quote are required" }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        quote,
        role: cleanString(body.role),
        location: cleanString(body.location),
        imageUrl: cleanString(body.imageUrl) || cleanString(body.photoUrl),
        rating: body.rating === null ? null : cleanInteger(body.rating, 5),
        status: cleanString(body.status) === "draft" ? "draft" : "published",
        order: cleanInteger(body.order),
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
