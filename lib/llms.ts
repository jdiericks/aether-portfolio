import { prisma } from "@/lib/prisma";
import { isUnavailablePrismaReadError } from "@/lib/prisma-errors";
import { getSiteContent, type SiteContentMap } from "@/lib/site-content";

interface LlmListing {
  title: string;
  slug: string;
  address: string;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  municipality: string | null;
  price: string;
  priceCurrency: string;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  status: string;
  description: string | null;
  updatedAt: Date;
}

export function markdownResponse(markdown: string) {
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

export function siteBaseUrl(content: SiteContentMap) {
  return (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");
}

function cleanMarkdown(value: string | null | undefined) {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getLlmSiteData() {
  const content = await getSiteContent();
  let listings: LlmListing[] = [];

  if (process.env.DATABASE_URL) {
    try {
      listings = await prisma.listing.findMany({
        where: { status: { not: "draft" } },
        orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
        select: {
          title: true,
          slug: true,
          address: true,
          city: true,
          state: true,
          neighborhood: true,
          municipality: true,
          price: true,
          priceCurrency: true,
          beds: true,
          baths: true,
          squareFeet: true,
          status: true,
          description: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (!isUnavailablePrismaReadError(error)) {
        throw error;
      }
    }
  }

  return { content, listings };
}

function publicPageLinks(baseUrl: string) {
  return [
    { title: "Home", url: `${baseUrl}/`, description: "Brand overview, featured listings, services, and contact form." },
    { title: "Listings", url: `${baseUrl}/listings`, description: "Public index of active property listings." },
    { title: "Sitemap", url: `${baseUrl}/site-map`, description: "Human-readable sitemap of public pages and listings." },
    { title: "Privacy Policy", url: `${baseUrl}/privacy`, description: "Privacy and data-use policy." },
    { title: "Terms of Service", url: `${baseUrl}/terms`, description: "Terms for using the site." },
    { title: "Accessibility Statement", url: `${baseUrl}/accessibility`, description: "Accessibility statement and support contact information." },
  ];
}

function markdownLink(title: string, url: string, description?: string) {
  return `- [${title}](${url})${description ? `: ${description}` : ""}`;
}

function listingSummary(listing: LlmListing, baseUrl: string) {
  const location = [
    listing.address,
    listing.neighborhood,
    listing.city,
    listing.municipality,
    listing.state,
  ].filter(Boolean).join(", ");
  const specs = [
    listing.beds !== null ? `${listing.beds} beds` : null,
    listing.baths !== null ? `${listing.baths} baths` : null,
    listing.squareFeet !== null ? `${listing.squareFeet.toLocaleString()} sq ft` : null,
  ].filter(Boolean);
  const description = cleanMarkdown(listing.description);

  return [
    `### ${listing.title}`,
    "",
    `- URL: ${baseUrl}/listings/${listing.slug}`,
    location ? `- Location: ${location}` : null,
    `- Price: ${listing.priceCurrency || "USD"} ${listing.price}`,
    specs.length > 0 ? `- Details: ${specs.join(", ")}` : null,
    `- Status: ${listing.status}`,
    description ? `- Summary: ${description.slice(0, 700)}` : null,
  ].filter(Boolean).join("\n");
}

export async function buildLlmsTxt() {
  const { content, listings } = await getLlmSiteData();
  const baseUrl = siteBaseUrl(content);
  const siteName = content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();
  const description = content.seo_description || content.hero_description || content.footer_description;

  const featuredListings = listings.slice(0, 12).map((listing) =>
    markdownLink(listing.title, `${baseUrl}/listings/${listing.slug}`, [
      [listing.city, listing.state].filter(Boolean).join(", "),
      `${listing.priceCurrency || "USD"} ${listing.price}`,
      listing.status,
    ].filter(Boolean).join(" | "))
  );

  return [
    `# ${siteName}`,
    "",
    `> ${description}`,
    "",
    "## Primary pages",
    ...publicPageLinks(baseUrl).map((link) => markdownLink(link.title, link.url, link.description)),
    "",
    "## Property listings",
    listings.length > 0
      ? featuredListings.join("\n")
      : "- No active public listings are currently published.",
    "",
    "## LLM context files",
    markdownLink("Full LLM context", `${baseUrl}/llms-full.txt`, "Expanded property and site context in Markdown."),
    markdownLink("LLM instructions", `${baseUrl}/llm-ctx.txt`, "Crawler guidance and editorial context."),
    markdownLink("XML sitemap", `${baseUrl}/sitemap.xml`, "Machine-readable sitemap for all public URLs."),
    "",
    "## Notes for AI agents",
    "- Prefer public listing pages as canonical sources for active property facts.",
    "- Do not use private dashboard, admin, API, or authentication URLs as public sources.",
    "- Property availability, pricing, and details can change; cite the listing URL when answering.",
  ].join("\n");
}

export async function buildLlmsFullText() {
  const { content, listings } = await getLlmSiteData();
  const baseUrl = siteBaseUrl(content);
  const siteName = content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();

  return [
    `# ${siteName} - Full LLM Context`,
    "",
    "## Site summary",
    cleanMarkdown(content.seo_description || content.hero_description || content.footer_description),
    "",
    "## Brand and contact",
    `- Brand: ${[content.brand_name, content.brand_subtitle].filter(Boolean).join(" ")}`,
    `- Location: ${content.contact_location || content.footer_location}`,
    `- Email: ${content.contact_email}`,
    `- Phone: ${content.contact_phone}`,
    "",
    "## Services",
    `- ${content.about_feature_1_title}: ${content.about_feature_1_description}`,
    `- ${content.about_feature_2_title}: ${content.about_feature_2_description}`,
    `- ${content.about_feature_3_title}: ${content.about_feature_3_description}`,
    `- ${content.about_feature_4_title}: ${content.about_feature_4_description}`,
    "",
    "## Public pages",
    ...publicPageLinks(baseUrl).map((link) => markdownLink(link.title, link.url, link.description)),
    "",
    "## Listings",
    listings.length > 0
      ? listings.map((listing) => listingSummary(listing, baseUrl)).join("\n\n")
      : "No active public listings are currently published.",
  ].join("\n");
}

export async function buildLlmContext() {
  const { content } = await getLlmSiteData();
  const baseUrl = siteBaseUrl(content);

  return [
    "# LLM Agent Context",
    "",
    "## Purpose",
    "This file gives AI agents editorial context for using this real estate website as a source.",
    "",
    "## Canonical source policy",
    `- Site root: ${baseUrl}/`,
    `- Listings index: ${baseUrl}/listings`,
    `- Sitemap: ${baseUrl}/sitemap.xml`,
    `- LLM index: ${baseUrl}/llms.txt`,
    `- Full LLM context: ${baseUrl}/llms-full.txt`,
    "",
    "## Access boundaries",
    "- Use only public pages for public answers.",
    "- Do not cite admin, dashboard, login, API, OAuth, or private client routes.",
    "- Treat listing pages as the source of truth for property-specific details.",
    "- If property status, price, or availability is important, recommend verifying through the listing contact flow.",
  ].join("\n");
}
