import { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp/server";
import { verifyAccessToken, cleanupExpiredOAuth } from "@/lib/mcp/oauth-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function extractAuthInfo(
  request: NextRequest,
): Promise<{ error?: Response }> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return {
      error: new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32001, message: "Unauthorized: Bearer token required" },
          id: null,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": "Bearer",
          },
        },
      ),
    };
  }

  try {
    await verifyAccessToken(auth.slice(7));
    return {};
  } catch {
    return {
      error: new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32001, message: "Unauthorized: Invalid or expired token" },
          id: null,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": "Bearer",
          },
        },
      ),
    };
  }
}

export async function POST(request: NextRequest) {
  const { error } = await extractAuthInfo(request);
  if (error) return error;

  if (Math.random() < 0.01) {
    cleanupExpiredOAuth().catch(() => {});
  }

  try {
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const server = createMcpServer();
    await server.connect(transport);

    const response = await transport.handleRequest(request);

    await server.close();

    return response;
  } catch (err) {
    console.error("MCP POST error:", err);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function GET(request: NextRequest) {
  const { error } = await extractAuthInfo(request);
  if (error) return error;

  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "SSE sessions are not supported in serverless mode. Use POST for all requests.",
      },
      id: null,
    }),
    { status: 405, headers: { "Content-Type": "application/json" } },
  );
}

export async function DELETE(request: NextRequest) {
  const { error } = await extractAuthInfo(request);
  if (error) return error;

  return new Response(null, { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
    },
  });
}
