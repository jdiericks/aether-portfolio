import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { MCP_TOOL_CATALOG } from "@/lib/mcp/tool-catalog";

export async function GET() {
  const result = await requirePermission("team.view");
  if (result.error) return result.error;
  return NextResponse.json({ tools: MCP_TOOL_CATALOG });
}
