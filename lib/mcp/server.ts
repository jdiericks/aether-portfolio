import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import { registerTools } from "@/mcp/tools";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "real-estate-admin", version: "1.0.0" },
    { capabilities: { logging: {} } },
  );
  registerTools(server, prisma);
  return server;
}
