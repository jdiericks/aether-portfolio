import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content";

export async function GET() {
  const rows = await prisma.siteContent.findMany();
  const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
  for (const row of rows) {
    content[row.key] = row.value;
  }
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const validKeys = Object.keys(SITE_CONTENT_DEFAULTS);
    const updates: { key: string; value: string }[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (!validKeys.includes(key)) continue;
      if (typeof value !== "string") continue;
      updates.push({ key, value });
    }

    await prisma.$transaction(
      updates.map(({ key, value }) =>
        prisma.siteContent.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    const rows = await prisma.siteContent.findMany();
    const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
    for (const row of rows) {
      content[row.key] = row.value;
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error updating site content:", error);
    return NextResponse.json(
      { error: "Failed to update site content" },
      { status: 500 }
    );
  }
}
