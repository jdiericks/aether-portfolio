import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function GET() {
  const result = await requirePermission("team.view");
  if (result.error) return result.error;

  const roles = await prisma.role.findMany({
    orderBy: [{ isOwner: "desc" }, { isSystem: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const result = await requirePermission("team.manage");
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const name = (body.name ?? "").toString().trim();
  const description =
    body.description == null ? null : body.description.toString().trim() || null;
  const permissions: string[] = Array.isArray(body.permissions)
    ? body.permissions.filter((p: unknown) => typeof p === "string")
    : [];
  const mcpAccess = body.mcpAccess === "all" || body.mcpAccess === "scoped"
    ? body.mcpAccess
    : "none";
  const mcpAllowedTools: string[] = Array.isArray(body.mcpAllowedTools)
    ? body.mcpAllowedTools.filter((t: unknown) => typeof t === "string")
    : [];

  if (!name) {
    return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  }

  const validPermissions = permissions.filter((p) =>
    ALL_PERMISSION_KEYS.includes(p as (typeof ALL_PERMISSION_KEYS)[number]),
  );

  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: validPermissions,
        mcpAccess,
        mcpAllowedTools: mcpAccess === "scoped" ? mcpAllowedTools : [],
        isSystem: false,
        isOwner: false,
      },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A role with that name already exists" },
        { status: 400 },
      );
    }
    console.error("Failed to create role:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
