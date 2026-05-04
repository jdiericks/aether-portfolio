import type { PermissionKey } from "./permissions";

/**
 * Maps an admin page path to the permission required to view it.
 *
 * The layout matches by longest prefix; first match wins. Paths with no entry
 * fall back to allowing any signed-in admin so we never accidentally lock
 * someone out of a brand new page that hasn't been gated yet.
 */
export const ADMIN_PAGE_PERMISSIONS: { prefix: string; permission: PermissionKey }[] = [
  { prefix: "/admin/listings", permission: "listings.view" },
  { prefix: "/admin/social-posts", permission: "social.view" },
  { prefix: "/admin/inquiries", permission: "inquiries.view" },
  { prefix: "/admin/clients", permission: "clients.view" },
  { prefix: "/admin/team", permission: "team.view" },
  { prefix: "/admin/branding", permission: "website.manage" },
  { prefix: "/admin/website", permission: "website.manage" },
  { prefix: "/admin/content", permission: "content.view" },
  { prefix: "/admin/testimonials", permission: "testimonials.manage" },
  { prefix: "/admin/insights", permission: "insights.view" },
  { prefix: "/admin/redirects", permission: "redirects.manage" },
  { prefix: "/admin/integrations", permission: "integrations.manage" },
  { prefix: "/admin/portfolio", permission: "listings.manage" },
  { prefix: "/admin", permission: "dashboard.view" },
];

export function permissionForAdminPath(pathname: string): PermissionKey | null {
  // Sort by descending length so the most specific prefix wins.
  const sorted = [...ADMIN_PAGE_PERMISSIONS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const rule of sorted) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      return rule.permission;
    }
  }
  return null;
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface ApiRule {
  prefix: string;
  /**
   * Permission required for each HTTP method. `null` means the method does not
   * require a permission (e.g. public GET endpoints).
   */
  byMethod: Partial<Record<Method, PermissionKey | null>>;
  /** Default permission applied to any method not listed in byMethod. */
  defaultPermission?: PermissionKey | null;
}

const ADMIN_API_RULES: ApiRule[] = [
  // Public-facing read endpoints with admin write side
  {
    prefix: "/api/listings",
    byMethod: { GET: null },
    defaultPermission: "listings.manage",
  },
  {
    prefix: "/api/testimonials",
    byMethod: { GET: null },
    defaultPermission: "testimonials.manage",
  },
  {
    prefix: "/api/content-posts",
    byMethod: { GET: null },
    defaultPermission: "content.manage",
  },
  {
    prefix: "/api/portfolio",
    byMethod: { GET: null },
    defaultPermission: "listings.manage",
  },

  // Admin-only resources
  { prefix: "/api/clients", byMethod: {}, defaultPermission: "clients.manage" },
  { prefix: "/api/photos", byMethod: {}, defaultPermission: "clients.manage" },
  { prefix: "/api/social-posts", byMethod: { GET: "social.view" }, defaultPermission: "social.manage" },
  { prefix: "/api/redirects", byMethod: { GET: "redirects.manage" }, defaultPermission: "redirects.manage" },
  { prefix: "/api/site-content", byMethod: { GET: null }, defaultPermission: "website.manage" },
  { prefix: "/api/uploads/blob", byMethod: {}, defaultPermission: "website.manage" },

  // Admin namespace
  { prefix: "/api/admin/inquiries", byMethod: { GET: "inquiries.view" }, defaultPermission: "inquiries.manage" },
  { prefix: "/api/admin/insights", byMethod: { GET: "insights.view" }, defaultPermission: "insights.view" },
  { prefix: "/api/admin/account", byMethod: {}, defaultPermission: "dashboard.view" },
  { prefix: "/api/admin/team", byMethod: { GET: "team.view" }, defaultPermission: "team.manage" },
  { prefix: "/api/admin/branding", byMethod: {}, defaultPermission: "website.manage" },

  // Integrations
  { prefix: "/api/meta", byMethod: {}, defaultPermission: "integrations.manage" },
];

export function permissionForApiRoute(
  pathname: string,
  method: string,
): PermissionKey | null | undefined {
  const sorted = [...ADMIN_API_RULES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const rule of sorted) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      const m = method.toUpperCase() as Method;
      if (m in rule.byMethod) {
        return rule.byMethod[m];
      }
      return rule.defaultPermission ?? null;
    }
  }
  return undefined;
}
