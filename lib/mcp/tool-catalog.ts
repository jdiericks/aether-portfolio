/**
 * Static catalog of every MCP tool exposed by `mcp/tools.ts`.
 *
 * Used by the admin team UI to render checkboxes for "scoped" MCP access on a
 * role or per-user basis, and by the MCP server factory to filter which tools
 * are visible to a particular authenticated user.
 *
 * Keep this list in sync with `registerTools()` in `mcp/tools.ts`.
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  group: string;
  /** Indicates the tool can mutate data (vs read-only). UI hint. */
  mutating: boolean;
}

export const MCP_TOOL_CATALOG: McpToolDefinition[] = [
  // Dashboard
  { name: "get_dashboard_stats", description: "Overview of clients, listings, and inquiries", group: "Dashboard", mutating: false },

  // Listings
  { name: "list_listings", description: "List property listings", group: "Listings", mutating: false },
  { name: "get_listing", description: "Get a single property listing", group: "Listings", mutating: false },
  { name: "create_listing", description: "Create a new property listing", group: "Listings", mutating: true },
  { name: "update_listing", description: "Update an existing property listing", group: "Listings", mutating: true },
  { name: "delete_listing", description: "Delete a property listing", group: "Listings", mutating: true },
  { name: "search_listings", description: "Search property listings", group: "Listings", mutating: false },

  // Social posts
  { name: "list_social_posts", description: "List social media drafts and posts", group: "Social", mutating: false },
  { name: "create_social_post_from_listing", description: "Generate a social post from a listing", group: "Social", mutating: true },
  { name: "create_social_post", description: "Create a custom social post draft", group: "Social", mutating: true },
  { name: "update_social_post", description: "Edit a social post draft", group: "Social", mutating: true },
  { name: "list_facebook_pages", description: "List connected Facebook pages", group: "Social", mutating: false },
  { name: "set_default_facebook_page", description: "Choose the default Facebook publishing target", group: "Social", mutating: true },
  { name: "publish_social_post_to_facebook", description: "Publish a social post to Facebook", group: "Social", mutating: true },

  // Clients
  { name: "list_clients", description: "List all client packages", group: "Clients", mutating: false },
  { name: "list_client_packages", description: "List buyer/seller client packages", group: "Clients", mutating: false },
  { name: "list_buyer_clients", description: "List buyer clients", group: "Clients", mutating: false },
  { name: "list_seller_clients", description: "List seller clients", group: "Clients", mutating: false },
  { name: "get_client", description: "Get a client package", group: "Clients", mutating: false },
  { name: "get_client_package", description: "Get a buyer/seller client package", group: "Clients", mutating: false },
  { name: "create_client", description: "Create a client package", group: "Clients", mutating: true },
  { name: "create_buyer_client", description: "Create a buyer client", group: "Clients", mutating: true },
  { name: "create_seller_client", description: "Create a seller client", group: "Clients", mutating: true },
  { name: "update_client", description: "Update a client package", group: "Clients", mutating: true },
  { name: "delete_client", description: "Delete a client package", group: "Clients", mutating: true },
  { name: "set_client_package_listings", description: "Set curated listings on a client", group: "Clients", mutating: true },
  { name: "update_buyer_client_curation", description: "Update curated listings for a buyer", group: "Clients", mutating: true },
  { name: "update_client_package_status", description: "Update a client's project status", group: "Clients", mutating: true },
  { name: "update_seller_client_status", description: "Update seller status / report", group: "Clients", mutating: true },
  { name: "search_clients", description: "Search for clients by name or email", group: "Clients", mutating: false },

  // Photos / portfolio
  { name: "list_client_photos", description: "List photos for a client", group: "Media", mutating: false },
  { name: "delete_photo", description: "Delete a client photo", group: "Media", mutating: true },
  { name: "reorder_photos", description: "Reorder a client's gallery", group: "Media", mutating: true },
  { name: "list_portfolio", description: "List public portfolio media", group: "Media", mutating: false },
  { name: "update_portfolio_photo", description: "Update a portfolio media item", group: "Media", mutating: true },
  { name: "delete_portfolio_photo", description: "Delete a portfolio media item", group: "Media", mutating: true },
  { name: "reorder_portfolio", description: "Reorder portfolio media", group: "Media", mutating: true },

  // Content
  { name: "list_content_posts", description: "List blog posts", group: "Content", mutating: false },
  { name: "get_content_post", description: "Get a blog post", group: "Content", mutating: false },
  { name: "create_content_post", description: "Create a blog post", group: "Content", mutating: true },
  { name: "update_content_post", description: "Update a blog post", group: "Content", mutating: true },
  { name: "delete_content_post", description: "Delete a blog post", group: "Content", mutating: true },

  // Site content / SEO
  { name: "get_site_content", description: "Get website copy and brand settings", group: "Site", mutating: false },
  { name: "update_site_content", description: "Update website copy and brand settings", group: "Site", mutating: true },
  { name: "get_seo_settings", description: "Get SEO metadata settings", group: "SEO", mutating: false },
  { name: "update_seo_settings", description: "Update SEO metadata settings", group: "SEO", mutating: true },

  // SEO Keywords / rankings
  { name: "add_seo_keyword", description: "Track a new SEO keyword", group: "SEO", mutating: true },
  { name: "list_seo_keywords", description: "List tracked SEO keywords", group: "SEO", mutating: false },
  { name: "record_seo_ranking", description: "Record a keyword ranking snapshot", group: "SEO", mutating: true },
  { name: "get_seo_ranking_report", description: "Get SEO ranking report", group: "SEO", mutating: false },
  { name: "generate_seo_recommendations", description: "Generate SEO recommendations", group: "SEO", mutating: false },
  { name: "list_google_search_console_sites", description: "List Google Search Console sites", group: "SEO", mutating: false },
  { name: "query_google_search_console", description: "Query Google Search Console data", group: "SEO", mutating: false },
  { name: "sync_google_search_console_rankings", description: "Sync GSC ranking data", group: "SEO", mutating: true },

  // Inquiries
  { name: "list_inquiries", description: "List contact form inquiries", group: "Inquiries", mutating: false },
  { name: "get_inquiry", description: "Get inquiry details", group: "Inquiries", mutating: false },
  { name: "update_inquiry", description: "Update an inquiry's status or response", group: "Inquiries", mutating: true },
  { name: "delete_inquiry", description: "Delete an inquiry", group: "Inquiries", mutating: true },
  { name: "search_inquiries", description: "Search inquiries", group: "Inquiries", mutating: false },

  // Correspondents
  { name: "list_correspondents", description: "List correspondents", group: "Correspondents", mutating: false },
  { name: "get_correspondent", description: "Get a correspondent", group: "Correspondents", mutating: false },
  { name: "create_correspondent", description: "Create a correspondent", group: "Correspondents", mutating: true },
  { name: "update_correspondent", description: "Update a correspondent", group: "Correspondents", mutating: true },
  { name: "delete_correspondent", description: "Delete a correspondent", group: "Correspondents", mutating: true },

  // Admin account
  { name: "get_admin_account", description: "Get the current admin account", group: "Account", mutating: false },
  { name: "update_admin_account", description: "Update the admin account", group: "Account", mutating: true },
];

export const ALL_MCP_TOOL_NAMES = MCP_TOOL_CATALOG.map((t) => t.name);
