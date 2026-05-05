import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { shouldSkipRedirectLookup } from "@/lib/redirects";
import { permissionForApiRoute } from "@/lib/route-permissions";

async function resolveRedirect(req: NextRequestWithAuth) {
  const pathWithSearch = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const resolveUrl = new URL("/api/redirects/resolve", req.url);
  resolveUrl.searchParams.set("path", pathWithSearch);

  try {
    const response = await fetch(resolveUrl, {
      headers: { "x-redirect-resolve": "1" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      redirect?: {
        destinationUrl?: string;
        statusCode?: number;
      } | null;
    };
    if (!data.redirect?.destinationUrl) return null;

    const targetUrl = new URL(data.redirect.destinationUrl, req.url);
    if (targetUrl.pathname === req.nextUrl.pathname && targetUrl.search === req.nextUrl.search) {
      return null;
    }

    return NextResponse.redirect(targetUrl, data.redirect.statusCode || 308);
  } catch (error) {
    console.error("Redirect resolution failed:", error);
    return null;
  }
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!shouldSkipRedirectLookup(path)) {
      const redirect = await resolveRedirect(req);
      if (redirect) return redirect;
    }

    // Admin routes - only allow admin role
    if (path.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Dashboard routes - only allow client role
    if (path.startsWith("/dashboard")) {
      if (token?.role !== "client") {
        if (token?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Permission-based gating for admin API routes. We only enforce when:
    //  - the user is an admin (clients are blocked elsewhere)
    //  - the route is mapped to a permission in lib/route-permissions
    //  - the JWT carries a permissions array (post-teams sessions). Pre-teams
    //    sessions skip this check and rely on the JWT callback to refresh
    //    permissions on the next request.
    if (
      path.startsWith("/api/") &&
      token?.role === "admin" &&
      Array.isArray(token.permissions)
    ) {
      const required = permissionForApiRoute(path, req.method);
      if (required) {
        const isOwner = Boolean(token.isOwner);
        const has = isOwner || token.permissions.includes(required);
        if (!has) {
          return NextResponse.json(
            { error: "Forbidden", required },
            { status: 403 },
          );
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow login page access
        if (path === "/login") {
          return true;
        }

        // Protected routes require authentication
        if (path.startsWith("/admin") || path.startsWith("/dashboard")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/:path*"],
  // MCP and OAuth routes are excluded by not being listed here.
  // /api/mcp/* and /.well-known/* are handled by their own auth.
};
