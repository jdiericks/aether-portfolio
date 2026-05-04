import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

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
    const { caption, order } = body;

    const updateData: Record<string, unknown> = {};

    if (caption !== undefined) {
      if (caption !== null && typeof caption !== "string") {
        return NextResponse.json({ error: "Invalid caption" }, { status: 400 });
      }
      updateData.caption = caption;
    }

    if (order !== undefined) {
      if (!Number.isInteger(order) || order < 0) {
        return NextResponse.json({ error: "Invalid order" }, { status: 400 });
      }
      updateData.order = order;
    }

    const photo = await prisma.portfolioPhoto.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error updating portfolio photo:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
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
    const photo = await prisma.portfolioPhoto.findUnique({
      where: { id },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    try {
      await del(photo.url);
    } catch {
      console.error("Failed to delete blob:", photo.blobKey);
    }

    await prisma.portfolioPhoto.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
