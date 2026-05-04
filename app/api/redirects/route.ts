import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { normalizeRedirectDestination, normalizeRedirectSource } from "@/lib/redirects";
import { prisma } from "@/lib/prisma";

const VALID_STATUS_CODES = new Set([301, 302, 307, 308]);

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
  const statusCode = Number(value || 308);
  return VALID_STATUS_CODES.has(statusCode) ? statusCode : 308;
}

function normalizeComparableDestination(value: string) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  return normalizeRedirectSource(value);
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const redirects = await prisma.redirectRule.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(redirects);
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const sourcePath = normalizeRedirectSource(body.sourcePath);
    const destination = normalizeRedirectDestination(body.destinationUrl ?? body.destination);

    if (!sourcePath || !destination) {
      return NextResponse.json(
        { error: "Old URL and destination URL are required" },
        { status: 400 }
      );
    }

    if (normalizeComparableDestination(destination) === sourcePath) {
      return NextResponse.json(
        { error: "Old URL and destination URL cannot be the same" },
        { status: 400 }
      );
    }

    const redirect = await prisma.redirectRule.create({
      data: {
        sourcePath,
        destinationUrl: destination,
        statusCode: cleanStatusCode(body.statusCode),
        isActive: body.isActive !== false,
        preserveQuery: body.preserveQuery !== false,
        notes: cleanString(body.notes),
      },
    });

    return NextResponse.json(redirect, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A redirect for this old URL already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating redirect:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create redirect" },
      { status: 500 }
    );
  }
}
