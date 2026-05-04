import { randomUUID } from "node:crypto";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { AdminOAuthProvider } from "./oauth.js";
import { registerTools } from "./tools.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.MCP_PORT || "8787", 10);
const BASE_URL = process.env.MCP_BASE_URL || `http://localhost:${PORT}`;
const OAUTH_CLIENT_ID = process.env.MCP_OAUTH_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.MCP_OAUTH_CLIENT_SECRET;

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// OAuth provider
// ---------------------------------------------------------------------------

const oauthProvider = new AdminOAuthProvider(prisma, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET);

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount OAuth endpoints (/.well-known/oauth-authorization-server, /authorize, /token, /register, /revoke)
app.use(
  mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl: new URL(BASE_URL),
    scopesSupported: ["admin"],
    clientRegistrationOptions: {},
    authorizationOptions: {},
  }),
);

// Custom route for the login form POST (the authorize endpoint shows the form,
// this route processes the admin credential submission)
app.post("/authorize/login", async (req, res) => {
  try {
    const { pending_id, email, password } = req.body;

    if (!pending_id || !email || !password) {
      res.status(400).send("Missing required fields");
      return;
    }

    await oauthProvider.handleLogin(pending_id, email, password, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal server error");
  }
});

// ---------------------------------------------------------------------------
// Bearer auth middleware for MCP endpoints
// ---------------------------------------------------------------------------

const bearerAuth = requireBearerAuth({
  verifier: oauthProvider,
  requiredScopes: [],
});

// ---------------------------------------------------------------------------
// MCP server factory — creates a fresh server per session with all tools
// ---------------------------------------------------------------------------

function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "real-estate-admin", version: "1.0.0" },
    { capabilities: { logging: {} } },
  );
  registerTools(server, prisma);
  return server;
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

const transports: Record<string, StreamableHTTPServerTransport> = {};

// POST /mcp — main MCP endpoint
app.post("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) delete transports[sid];
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad request: no valid session" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP POST error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// GET /mcp — SSE stream for server-initiated messages
app.get("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

// DELETE /mcp — session termination
app.delete("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "real-estate-admin-mcp", version: "1.0.0" });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Real Estate Admin MCP server listening on port ${PORT}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`MCP endpoint: ${BASE_URL}/mcp`);
  console.log(`OAuth metadata: ${BASE_URL}/.well-known/oauth-authorization-server`);
  if (OAUTH_CLIENT_ID) {
    console.log(`Static OAuth client configured: ${OAUTH_CLIENT_ID}`);
  } else {
    console.log("No static OAuth client — Dynamic Client Registration is available at /register");
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  for (const sid of Object.keys(transports)) {
    try {
      await transports[sid].close();
      delete transports[sid];
    } catch (e) {
      console.error(`Error closing session ${sid}:`, e);
    }
  }
  await prisma.$disconnect();
  process.exit(0);
});
