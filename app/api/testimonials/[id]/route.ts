import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = cleanString(body.name);
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    data.name = name;
  }
  if (body.quote !== undefined) {
    const quote = cleanString(body.quote);
    if (!quote) return NextResponse.json({ error: "Quote is required" }, { status: 400 });
    data.quote = quote;
  }
  if (body.role !== undefined) data.role = cleanString(body.role);
  if (body.location !== undefined) data.location = cleanString(body.location);
  if (body.imageUrl !== undefined || body.photoUrl !== undefined) {
    data.imageUrl = cleanString(body.imageUrl ?? body.photoUrl);
  }
  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    data.rating = Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : null;
  }
  if (body.status !== undefined) data.status = cleanString(body.status) || "draft";
  if (body.order !== undefined) {
    const order = Number(body.order);
    data.order = Number.isFinite(order) ? Math.max(0, Math.round(order)) : 0;
  }

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
    });
    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update testimonial" },
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
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
