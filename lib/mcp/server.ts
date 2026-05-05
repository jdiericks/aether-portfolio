import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import { registerTools } from "@/mcp/tools";

export interface CreateMcpServerOptions {
  /** When provided, only tools matching this predicate are registered. */
  toolFilter?: (toolName: string) => boolean;
}

export function createMcpServer(options: CreateMcpServerOptions = {}): McpServer {
  const server = new McpServer(
    { name: "real-estate-admin", version: "1.0.0" },
    { capabilities: { logging: {} } },
  );

  if (options.toolFilter) {
    const filter = options.toolFilter;
    const originalTool = server.tool.bind(server) as (...args: unknown[]) => unknown;
    (server as unknown as { tool: (...args: unknown[]) => unknown }).tool = (
      ...args: unknown[]
    ) => {
      const toolName = typeof args[0] === "string" ? args[0] : null;
      if (toolName && !filter(toolName)) {
        return undefined;
      }
      return originalTool(...args);
    };
  }

  registerTools(server, prisma);
  return server;
}
