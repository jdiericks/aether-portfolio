import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRedirectDestination, normalizeRedirectSource } from "@/lib/redirects";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanStatusCode(value: unknown) {
  const statusCode = Number(value);
  return [301, 302, 307, 308].includes(statusCode) ? statusCode : 308;
}

function normalizeComparableDestination(value: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  return normalizeRedirectSource(value);
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

  try {
    const current = await prisma.redirectRule.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Redirect rule not found" }, { status: 404 });
    }

    let sourcePath = current.sourcePath;
    let destination = current.destinationUrl;

    if (body.sourcePath !== undefined) {
      const normalizedSourcePath = normalizeRedirectSource(body.sourcePath);
      if (!normalizedSourcePath) {
        return NextResponse.json({ error: "Old URL is required" }, { status: 400 });
      }
      sourcePath = normalizedSourcePath;
      data.sourcePath = sourcePath;
    }

    if (body.destinationUrl !== undefined || body.destination !== undefined) {
      const normalizedDestination = normalizeRedirectDestination(
        body.destinationUrl ?? body.destination
      );
      if (!normalizedDestination) {
        return NextResponse.json({ error: "New URL is required" }, { status: 400 });
      }
      destination = normalizedDestination;
      data.destinationUrl = destination;
    }

    if (normalizeComparableDestination(destination) === sourcePath) {
      return NextResponse.json(
        { error: "Old URL and new URL cannot be the same path" },
        { status: 400 }
      );
    }

    if (body.statusCode !== undefined) data.statusCode = cleanStatusCode(body.statusCode);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.preserveQuery !== undefined) data.preserveQuery = Boolean(body.preserveQuery);
    if (body.notes !== undefined) data.notes = cleanString(body.notes);

    const rule = await prisma.redirectRule.update({
      where: { id },
      data,
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A redirect already exists for that old URL" },
        { status: 409 }
      );
    }

    console.error("Error updating redirect rule:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update redirect rule" },
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
    await prisma.redirectRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting redirect rule:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete redirect rule" },
      { status: 500 }
    );
  }
}
