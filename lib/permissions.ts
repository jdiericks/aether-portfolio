import type { Role, User } from "@prisma/client";

// ---------------------------------------------------------------------------
// Permission catalog
// ---------------------------------------------------------------------------
//
// Permissions are simple string keys. They are grouped by feature for the
// admin UI, but stored as a flat string[] on Role.permissions. Each Role lists
// the permissions it grants. The Owner role implicitly has every permission
// regardless of what is stored on it.

export type PermissionKey =
  | "dashboard.view"
  | "listings.view"
  | "listings.manage"
  | "social.view"
  | "social.manage"
  | "social.publish"
  | "inquiries.view"
  | "inquiries.manage"
  | "clients.view"
  | "clients.manage"
  | "content.view"
  | "content.manage"
  | "testimonials.manage"
  | "redirects.manage"
  | "website.manage"
  | "integrations.manage"
  | "insights.view"
  | "team.view"
  | "team.manage"
  | "mcp.use";

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  description: string;
  group: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { key: "dashboard.view", label: "View dashboard", description: "Access the admin dashboard overview", group: "General" },
  { key: "team.view", label: "View team", description: "See team members and roles", group: "Team" },
  { key: "team.manage", label: "Manage team", description: "Invite members, assign roles, create roles", group: "Team" },
  { key: "listings.view", label: "View listings", description: "Read access to property listings", group: "Listings" },
  { key: "listings.manage", label: "Manage listings", description: "Create, edit, and delete listings", group: "Listings" },
  { key: "social.view", label: "View social posts", description: "Read access to social media drafts", group: "Social" },
  { key: "social.manage", label: "Manage social posts", description: "Create and edit social drafts", group: "Social" },
  { key: "social.publish", label: "Publish to social", description: "Publish posts to Facebook/Instagram", group: "Social" },
  { key: "inquiries.view", label: "View inquiries", description: "Read access to contact submissions", group: "Inquiries" },
  { key: "inquiries.manage", label: "Manage inquiries", description: "Update status, reply, archive", group: "Inquiries" },
  { key: "clients.view", label: "View clients", description: "Read access to client packages", group: "Clients" },
  { key: "clients.manage", label: "Manage clients", description: "Create, edit, and delete client packages", group: "Clients" },
  { key: "content.view", label: "View content", description: "Read access to blog posts and pages", group: "Content" },
  { key: "content.manage", label: "Manage content", description: "Create, edit, publish blog posts", group: "Content" },
  { key: "testimonials.manage", label: "Manage testimonials", description: "Create and edit testimonials", group: "Content" },
  { key: "redirects.manage", label: "Manage redirects", description: "Create and edit redirect rules", group: "Website" },
  { key: "website.manage", label: "Manage website", description: "Edit site content, theme, and settings", group: "Website" },
  { key: "integrations.manage", label: "Manage integrations", description: "Configure Meta, Google, and other integrations", group: "Website" },
  { key: "insights.view", label: "View insights", description: "Read access to analytics and SEO data", group: "Insights" },
  { key: "mcp.use", label: "Use MCP", description: "Required to authenticate against the MCP server", group: "MCP" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export const PERMISSION_GROUPS = Array.from(new Set(PERMISSIONS.map((p) => p.group)));

// ---------------------------------------------------------------------------
// Effective permissions / MCP access
// ---------------------------------------------------------------------------

export type McpAccess = "none" | "all" | "scoped";
export type UserMcpAccess = McpAccess | "inherit";

export interface EffectiveAccess {
  isOwner: boolean;
  permissions: Set<PermissionKey>;
  mcpAccess: McpAccess;
  mcpAllowedTools: Set<string>;
}

export function computeEffectiveAccess(
  user: Pick<User, "isActive" | "mcpAccess" | "mcpAllowedTools"> | null | undefined,
  role: Pick<Role, "isOwner" | "permissions" | "mcpAccess" | "mcpAllowedTools"> | null | undefined,
): EffectiveAccess {
  if (!user || !user.isActive) {
    return {
      isOwner: false,
      permissions: new Set(),
      mcpAccess: "none",
      mcpAllowedTools: new Set(),
    };
  }

  if (role?.isOwner) {
    return {
      isOwner: true,
      permissions: new Set(ALL_PERMISSION_KEYS),
      mcpAccess: "all",
      mcpAllowedTools: new Set(),
    };
  }

  const permissions = new Set<PermissionKey>(
    (role?.permissions ?? []).filter((p): p is PermissionKey =>
      ALL_PERMISSION_KEYS.includes(p as PermissionKey),
    ),
  );

  let mcpAccess: McpAccess;
  let mcpAllowedTools: Set<string>;

  const userOverride = (user.mcpAccess ?? "inherit") as UserMcpAccess;
  if (userOverride === "inherit") {
    mcpAccess = (role?.mcpAccess as McpAccess | undefined) ?? "none";
    mcpAllowedTools = new Set(role?.mcpAllowedTools ?? []);
  } else {
    mcpAccess = userOverride;
    mcpAllowedTools = new Set(user.mcpAllowedTools ?? []);
  }

  // Anyone with MCP access must also have the mcp.use permission. We grant it
  // implicitly when their effective access is not "none" so that the gate is
  // a single check at the API layer.
  if (mcpAccess !== "none") {
    permissions.add("mcp.use");
  }

  return {
    isOwner: false,
    permissions,
    mcpAccess,
    mcpAllowedTools,
  };
}

export function hasPermission(
  effective: EffectiveAccess,
  permission: PermissionKey,
): boolean {
  return effective.isOwner || effective.permissions.has(permission);
}

export function canUseMcpTool(
  effective: EffectiveAccess,
  toolName: string,
): boolean {
  if (effective.mcpAccess === "none") return false;
  if (effective.mcpAccess === "all") return true;
  return effective.mcpAllowedTools.has(toolName);
}

// ---------------------------------------------------------------------------
// Default roles seeded by db:seed:admin
// ---------------------------------------------------------------------------

export interface DefaultRoleSeed {
  name: string;
  description: string;
  isSystem: boolean;
  isOwner: boolean;
  permissions: PermissionKey[];
  mcpAccess: McpAccess;
}

export const DEFAULT_ROLES: DefaultRoleSeed[] = [
  {
    name: "Owner",
    description: "Full access to everything, including team management. Cannot be edited or deleted.",
    isSystem: true,
    isOwner: true,
    permissions: [],
    mcpAccess: "all",
  },
  {
    name: "Admin",
    description: "Manage all content, listings, clients, and site settings. Cannot manage team.",
    isSystem: true,
    isOwner: false,
    permissions: ALL_PERMISSION_KEYS.filter(
      (p) => p !== "team.manage",
    ),
    mcpAccess: "all",
  },
  {
    name: "Editor",
    description: "Create and edit listings, content, and social posts. No site settings or team access.",
    isSystem: true,
    isOwner: false,
    permissions: [
      "dashboard.view",
      "listings.view",
      "listings.manage",
      "social.view",
      "social.manage",
      "inquiries.view",
      "inquiries.manage",
      "content.view",
      "content.manage",
      "testimonials.manage",
      "insights.view",
    ],
    mcpAccess: "none",
  },
  {
    name: "Member",
    description: "Read-only access. Useful for stakeholders who only need visibility.",
    isSystem: true,
    isOwner: false,
    permissions: [
      "dashboard.view",
      "listings.view",
      "social.view",
      "inquiries.view",
      "clients.view",
      "content.view",
      "insights.view",
    ],
    mcpAccess: "none",
  },
];
