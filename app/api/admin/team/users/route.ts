import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";
import { sendTeamInviteEmail } from "@/lib/email-templates";
import { getSiteContent } from "@/lib/site-content";

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

export async function GET() {
  const result = await requirePermission("team.view");
  if (result.error) return result.error;

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: userSelect,
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const result = await requirePermission("team.manage");
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const email = (body.email ?? "").toString().trim().toLowerCase();
  const name = (body.name ?? "").toString().trim();
  const password = (body.password ?? "").toString();
  const roleId = body.roleId ? body.roleId.toString() : null;
  const mcpAccess =
    body.mcpAccess === "none" || body.mcpAccess === "all" || body.mcpAccess === "scoped"
      ? body.mcpAccess
      : "inherit";
  const mcpAllowedTools: string[] = Array.isArray(body.mcpAllowedTools)
    ? body.mcpAllowedTools.filter((t: unknown) => typeof t === "string")
    : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        roleId,
        mcpAccess,
        mcpAllowedTools: mcpAccess === "scoped" ? mcpAllowedTools : [],
        invitedById: result.admin.userId,
      },
      select: userSelect,
    });

    // Fire off the invite email (best-effort; don't fail the API on email errors).
    const sendInvites =
      (await getSiteContent()).email_send_team_invites !== "false";
    if (sendInvites) {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        new URL(request.url).origin.replace(/\/$/, "");
      const loginUrl = `${baseUrl}/login`;
      sendTeamInviteEmail({
        to: email,
        recipientName: name,
        roleName: user.role?.name ?? "Member",
        inviterName: result.admin.name,
        loginUrl,
        temporaryPassword: password,
      }).catch((err) => {
        console.error("[team] invite email failed:", err);
      });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A user with that email already exists" },
        { status: 400 },
      );
    }
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
