import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-log";

interface Context {
  params: Promise<{ id: string }>;
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  mcpAccess: true,
  mcpAllowedTools: true,
  roleId: true,
  role: { select: { id: true, name: true, isOwner: true } },
  invitedById: true,
  invitedBy: { select: { id: true, name: true, email: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function PATCH(request: Request, { params }: Context) {
  const result = await requirePermission("team.manage");
  if (result.error) return result.error;

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data: Prisma.UserUpdateInput = {};
  const isSelf = target.id === result.admin.userId;
  const isTargetOwner = target.role?.isOwner ?? false;

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    data.email = email;
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    data.password = await bcrypt.hash(body.password, 12);
  }

  if (body.roleId !== undefined) {
    const newRoleId = body.roleId === null ? null : body.roleId.toString();
    if (newRoleId) {
      const newRole = await prisma.role.findUnique({ where: { id: newRoleId } });
      if (!newRole) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      // Don't allow removing Owner role from yourself if you're the only owner
      if (isTargetOwner && !newRole.isOwner) {
        const ownersCount = await prisma.user.count({
          where: { role: { isOwner: true }, isActive: true },
        });
        if (ownersCount <= 1) {
          return NextResponse.json(
            { error: "There must be at least one active Owner" },
            { status: 400 },
          );
        }
      }
      // Only Owners can promote another user to Owner.
      if (newRole.isOwner && !result.admin.effective.isOwner) {
        return NextResponse.json(
          { error: "Only an Owner can grant the Owner role" },
          { status: 403 },
        );
      }
    }
    data.role = newRoleId
      ? { connect: { id: newRoleId } }
      : { disconnect: true };
  }

  if (body.mcpAccess !== undefined) {
    if (
      body.mcpAccess !== "inherit" &&
      body.mcpAccess !== "none" &&
      body.mcpAccess !== "all" &&
      body.mcpAccess !== "scoped"
    ) {
      return NextResponse.json({ error: "Invalid mcpAccess value" }, { status: 400 });
    }
    data.mcpAccess = body.mcpAccess;
    if (body.mcpAccess !== "scoped") {
      data.mcpAllowedTools = [];
    }
  }
  if (Array.isArray(body.mcpAllowedTools)) {
    data.mcpAllowedTools = body.mcpAllowedTools.filter(
      (t: unknown): t is string => typeof t === "string",
    );
  }

  if (typeof body.isActive === "boolean") {
    if (isSelf && !body.isActive) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }
    if (isTargetOwner && !body.isActive) {
      const ownersCount = await prisma.user.count({
        where: { role: { isOwner: true }, isActive: true },
      });
      if (ownersCount <= 1) {
        return NextResponse.json(
          { error: "There must be at least one active Owner" },
          { status: 400 },
        );
      }
    }
    data.isActive = body.isActive;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    const changes: string[] = [];
    if (data.name) changes.push("name");
    if (data.email) changes.push("email");
    if (data.password) changes.push("password");
    if (data.role) changes.push("role");
    if (data.mcpAccess !== undefined) changes.push("mcpAccess");
    if (data.mcpAllowedTools !== undefined) changes.push("mcpAllowedTools");
    if (data.isActive !== undefined) changes.push("isActive");

    await recordAuditLog({
      actor: result.admin,
      action: data.isActive === false ? "team.user.deactivate" : data.isActive === true ? "team.user.activate" : "team.user.update",
      category: "team",
      summary: data.isActive === false
        ? `Deactivated ${user.name} <${user.email}>`
        : data.isActive === true
          ? `Activated ${user.name} <${user.email}>`
          : `Updated ${user.name} <${user.email}> (${changes.join(", ") || "no changes"})`,
      entityType: "user",
      entityId: user.id,
      metadata: { changedFields: changes },
      request,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 },
      );
    }
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const result = await requirePermission("team.manage");
  if (result.error) return result.error;

  const { id } = await params;
  if (id === result.admin.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role?.isOwner) {
    const ownersCount = await prisma.user.count({
      where: { role: { isOwner: true }, isActive: true },
    });
    if (ownersCount <= 1) {
      return NextResponse.json(
        { error: "There must be at least one active Owner" },
        { status: 400 },
      );
    }
  }

  await prisma.user.delete({ where: { id } });

  await recordAuditLog({
    actor: result.admin,
    action: "team.user.delete",
    category: "team",
    summary: `Removed ${target.name} <${target.email}> from the team`,
    entityType: "user",
    entityId: target.id,
    metadata: { roleName: target.role?.name ?? null },
    request: _request,
  });

  return NextResponse.json({ ok: true });
}
