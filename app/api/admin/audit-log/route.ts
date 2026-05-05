import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const result = await requirePermission("team.view");
  if (result.error) return result.error;

  const url = request.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const category = url.searchParams.get("category") || undefined;
  const action = url.searchParams.get("action") || undefined;
  const actorId = url.searchParams.get("actorId") || undefined;
  const search = url.searchParams.get("q")?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  if (search) {
    where.OR = [
      { summary: { contains: search, mode: "insensitive" } },
      { actorName: { contains: search, mode: "insensitive" } },
      { actorEmail: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Distinct categories + actors for filter dropdowns.
  const [categories, actors] = await Promise.all([
    prisma.auditLog.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { actorId: { not: null } },
      distinct: ["actorId"],
      select: { actorId: true, actorName: true, actorEmail: true },
      orderBy: { actorName: "asc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    filters: {
      categories: categories.map((c) => c.category),
      actors,
    },
  });
}
