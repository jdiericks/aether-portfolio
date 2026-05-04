import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const result = await requirePermission("team.view");
  if (result.error) return result.error;

  const { id } = await params;
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  return NextResponse.json({ role });
}

export async function PATCH(request: Request, { params }: Context) {
  const result = await requirePermission("team.manage");
  if (result.error) return result.error;

  const { id } = await params;
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  if (role.isOwner) {
    return NextResponse.json(
      { error: "The Owner role cannot be edited" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const data: Prisma.RoleUpdateInput = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Role name required" }, { status: 400 });
    data.name = name;
  }
  if (body.description !== undefined) {
    data.description = body.description == null ? null : body.description.toString().trim() || null;
  }
  if (Array.isArray(body.permissions)) {
    data.permissions = body.permissions.filter(
      (p: unknown): p is string =>
        typeof p === "string" &&
        ALL_PERMISSION_KEYS.includes(p as (typeof ALL_PERMISSION_KEYS)[number]),
    );
  }
  if (body.mcpAccess === "none" || body.mcpAccess === "all" || body.mcpAccess === "scoped") {
    data.mcpAccess = body.mcpAccess;
  }
  if (Array.isArray(body.mcpAllowedTools)) {
    data.mcpAllowedTools = body.mcpAllowedTools.filter((t: unknown) => typeof t === "string");
  }
  // If access is being set to anything other than scoped, clear allowed tools.
  if (data.mcpAccess !== undefined && data.mcpAccess !== "scoped") {
    data.mcpAllowedTools = [];
  }

  try {
    const updated = await prisma.role.update({ where: { id }, data });
    return NextResponse.json({ role: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A role with that name already exists" },
        { status: 400 },
      );
    }
    console.error("Failed to update role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const result = await requirePermission("team.manage");
  if (result.error) return result.error;

  const { id } = await params;
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  if (role.isSystem || role.isOwner) {
    return NextResponse.json(
      { error: "Built-in roles cannot be deleted" },
      { status: 400 },
    );
  }
  if (role._count.users > 0) {
    return NextResponse.json(
      { error: "Reassign team members before deleting this role" },
      { status: 400 },
    );
  }

  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
