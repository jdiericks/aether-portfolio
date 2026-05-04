import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  dateDaysAgo,
  listSearchConsoleSites,
  querySearchConsole,
} from "@/lib/google-search-console";
import { generateListingSocialPost } from "@/lib/social-posts";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

function fmt(date: Date): string {
  return date.toISOString();
}

const listingPayload = {
  title: z.string().optional().describe("Listing title or property name"),
  address: z.string().optional().describe("Street address or public display address"),
  city: z.string().optional().describe("City or market area"),
  region: z.string().optional().describe("State, province, or region"),
  neighborhood: z.string().nullable().optional().describe("Neighborhood or colonia"),
  municipality: z.string().nullable().optional().describe("Municipality/delegacion"),
  postalCode: z.string().nullable().optional().describe("Postal code"),
  country: z.string().optional().describe("Country code, defaults to MX"),
  latitude: z.number().nullable().optional().describe("Latitude for map and JSON-LD"),
  longitude: z.number().nullable().optional().describe("Longitude for map and JSON-LD"),
  price: z.string().optional().describe("Display price, such as $925,000"),
  priceCurrency: z.enum(["USD", "MXN"]).optional().describe("Listing currency"),
  beds: z.number().int().nonnegative().nullable().optional().describe("Bedroom count"),
  baths: z.number().nonnegative().nullable().optional().describe("Bathroom count"),
  squareFeet: z.number().int().nonnegative().nullable().optional().describe("Interior square footage"),
  lotSize: z.string().nullable().optional().describe("Lot size display text"),
  description: z.string().nullable().optional().describe("Listing description"),
  heroImage: z.string().nullable().optional().describe("Primary listing image URL"),
  videoUrl: z.string().nullable().optional().describe("Featured listing video URL"),
  gallery: z.array(z.object({
    url: z.string(),
    type: z.enum(["image", "video"]).optional(),
    alt: z.string().optional(),
  })).nullable().optional().describe("Listing gallery media items"),
  agentName: z.string().nullable().optional().describe("Listing agent name"),
  agentTitle: z.string().nullable().optional().describe("Listing agent title"),
  agentEmail: z.string().nullable().optional().describe("Listing agent email"),
  agentPhone: z.string().nullable().optional().describe("Listing agent phone"),
  agentWhatsapp: z.string().nullable().optional().describe("Listing agent WhatsApp URL"),
  agentPhotoUrl: z.string().nullable().optional().describe("Listing agent photo URL"),
  facebookUrl: z.string().nullable().optional().describe("Listing Facebook marketing URL"),
  instagramUrl: z.string().nullable().optional().describe("Listing Instagram marketing URL"),
  status: z.string().optional().describe("Listing status, such as active, pending, sold, or draft"),
  isFeatured: z.boolean().optional().describe("Whether the listing appears on the public homepage"),
  order: z.number().int().min(0).optional().describe("Display order for featured listings"),
};

function listingSelect() {
  return {
    id: true,
    title: true,
    address: true,
    city: true,
    state: true,
    neighborhood: true,
    municipality: true,
    postalCode: true,
    country: true,
    latitude: true,
    longitude: true,
    price: true,
    priceCurrency: true,
    beds: true,
    baths: true,
    squareFeet: true,
    lotSize: true,
    description: true,
    imageUrl: true,
    videoUrl: true,
    gallery: true,
    agentName: true,
    agentTitle: true,
    agentEmail: true,
    agentPhone: true,
    agentWhatsapp: true,
    agentPhotoUrl: true,
    facebookUrl: true,
    instagramUrl: true,
    status: true,
    isFeatured: true,
    order: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

function clientSelect() {
  return {
    id: true,
    name: true,
    email: true,
    slug: true,
    packageType: true,
    projectStatus: true,
    interestSummary: true,
    sellerReport: true,
    isActive: true,
    isPublic: true,
    createdAt: true,
    updatedAt: true,
    photos: {
      orderBy: { order: "asc" as const },
      select: {
        id: true,
        url: true,
        filename: true,
        order: true,
        width: true,
        height: true,
        createdAt: true,
      },
    },
    listings: {
      orderBy: { order: "asc" as const },
      select: {
        id: true,
        note: true,
        order: true,
        listing: {
          select: listingSelect(),
        },
      },
    },
  } as const;
}

function cleanNullableString(value: string | null | undefined) {
  if (value === null || value === undefined) return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePriceAmount(price: string | null | undefined) {
  if (!price) return null;
  const parsed = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  hero_background_image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
  hero_tagline: "Boutique Real Estate Advisory",
  hero_title: "Diericks",
  hero_subtitle: "Realty",
  hero_description: "Helping buyers, sellers, and investors move with confidence across Ensenada and Baja California.",
  hero_cta_primary: "View Listings",
  hero_cta_secondary: "Schedule a Consultation",
  about_label: "About Us",
  about_title: "Local Guidance for Better Real Estate Decisions",
  about_description_1: "We help clients understand neighborhoods, evaluate properties, and move through each step of the transaction with clarity.",
  about_description_2: "From first tours to listing strategy and secure document sharing, the process is built to feel organized, transparent, and personal.",
  about_feature_1_icon: "Home",
  about_feature_1_title: "Buyer Representation",
  about_feature_1_description: "Curated searches, private tours, and offer guidance tailored to how you want to live.",
  about_feature_2_icon: "Award",
  about_feature_2_title: "Listing Strategy",
  about_feature_2_description: "Pricing, presentation, and launch planning designed to bring the right buyers to the table.",
  about_feature_3_icon: "MapPin",
  about_feature_3_title: "Neighborhood Insight",
  about_feature_3_description: "Practical local context for lifestyle, value, rental potential, and long-term fit.",
  about_feature_4_icon: "FileText",
  about_feature_4_title: "Secure Property Packages",
  about_feature_4_description: "Share disclosures, photos, and property documents securely with clients and qualified buyers.",
  contact_label: "Let's Talk Real Estate",
  contact_title: "Start Your Next Move",
  contact_description: "Tell us what you are looking for, selling, or evaluating, and we will follow up with next steps.",
  contact_email: "hello@diericksrealty.com",
  contact_phone: "+52 646 XXX XXXX",
  contact_phone_href: "",
  contact_location: "Ensenada, Baja California",
  contact_note: "Based in Ensenada and serving residential clients throughout Baja California.",
  brand_name: "Diericks",
  brand_subtitle: "Realty",
  footer_location: "Ensenada, Baja California",
  social_instagram: "",
  social_facebook: "",
  seo_site_url: "https://diericksrealty.com",
  seo_site_name: "Diericks Realty",
  seo_title_default: "Diericks Realty | Boutique Real Estate Advisory",
  seo_title_template: "%s | Diericks Realty",
  seo_description: "Boutique real estate advisory for buyers, sellers, and investors.",
  seo_keywords: "boutique real estate, featured listings, buyer representation, seller representation",
  seo_og_image: "/og-image.jpg",
  seo_og_image_alt: "Diericks Realty - curated homes and real estate advisory",
  seo_twitter_title: "Diericks Realty | Boutique Real Estate Advisory",
  seo_twitter_description: "Curated real estate guidance, listing marketing, and private property packets.",
  seo_home_title: "Diericks Realty | Boutique Real Estate Advisory",
  seo_home_description: "Curated real estate guidance for buyers, sellers, and investors.",
  seo_listings_title: "Listings",
  seo_listings_description: "Browse active and recently updated real estate listings.",
  seo_google_verification: "",
  theme_header_transparent_bg: "transparent",
  theme_header_transparent_text: "#ffffff",
  theme_header_bg: "rgba(255, 255, 255, 0.95)",
  theme_header_text: "#171717",
  theme_header_border: "#e5e5e5",
  theme_footer_social_bg: "#e5e5e5",
  theme_footer_social_color: "#171717",
  theme_footer_social_hover_bg: "#d4d4d4",
  theme_footer_social_hover_color: "#171717",
  theme_footer_social_radius: "9999px",
  theme_footer_social_size: "2.5rem",
  theme_footer_social_icon_size: "1.25rem",
  theme_section_bg: "#ffffff",
  theme_section_text: "#171717",
  theme_card_radius: "1rem",
};

export function registerTools(server: McpServer, prisma: PrismaClient) {
  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  server.tool(
    "get_dashboard_stats",
    "Get an overview of all dashboard statistics including client counts, photo counts, inquiry counts by status, and recent activity",
    async () => {
      const [
        totalClients,
        activeClients,
        totalPhotos,
        totalPortfolioPhotos,
        inquiryStats,
        totalListings,
        featuredListings,
        recentClients,
        recentInquiries,
      ] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { isActive: true } }),
        prisma.photo.count(),
        prisma.portfolioPhoto.count(),
        prisma.contactSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.listing.count(),
        prisma.listing.count({ where: { isFeatured: true } }),
        prisma.client.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, slug: true, isActive: true, createdAt: true } }),
        prisma.contactSubmission.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, eventType: true, status: true, createdAt: true } }),
      ]);
      const inquiryCounts: Record<string, number> = { new: 0, read: 0, replied: 0, archived: 0 };
      for (const row of inquiryStats) inquiryCounts[row.status] = row._count._all;
      const totalInquiries = Object.values(inquiryCounts).reduce((a, b) => a + b, 0);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ clients: { total: totalClients, active: activeClients, inactive: totalClients - activeClients }, listings: { total: totalListings, featured: featuredListings }, assets: { clientAssets: totalPhotos, featuredMedia: totalPortfolioPhotos }, inquiries: { total: totalInquiries, ...inquiryCounts }, recentClients, recentInquiries }, null, 2),
        }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Listing Management
  // -------------------------------------------------------------------------

  server.tool(
    "list_listings",
    "List real estate listings, optionally filtered by featured flag or status",
    {
      status: z.string().optional().describe("Optional listing status filter"),
      featuredOnly: z.boolean().optional().describe("Only return listings featured on the public homepage"),
    },
    async ({ status, featuredOnly }) => {
      const listings = await prisma.listing.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(featuredOnly ? { isFeatured: true } : {}),
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        select: listingSelect(),
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ total: listings.length, listings }, null, 2) }] };
    },
  );

  server.tool(
    "get_listing",
    "Get a single real estate listing by ID",
    { listingId: z.string().describe("The listing ID") },
    async ({ listingId }) => {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: listingSelect(),
      });
      if (!listing) return { content: [{ type: "text" as const, text: "Error: Listing not found" }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(listing, null, 2) }] };
    },
  );

  server.tool(
    "create_listing",
    "Create a real estate listing that can be featured on the public homepage",
    {
      title: z.string().describe("Listing title or property name"),
      address: z.string().describe("Street address or public display address"),
      city: z.string().describe("City or market area"),
      region: z.string().optional().describe("State, province, or region"),
      neighborhood: z.string().optional().describe("Neighborhood or colonia"),
      municipality: z.string().optional().describe("Municipality/delegacion"),
      postalCode: z.string().optional().describe("Postal code"),
      country: z.string().optional().describe("Country code, defaults to MX"),
      latitude: z.number().optional().describe("Latitude for map and JSON-LD"),
      longitude: z.number().optional().describe("Longitude for map and JSON-LD"),
      price: z.string().describe("Display price, such as $925,000"),
      priceCurrency: z.enum(["USD", "MXN"]).optional().describe("Listing currency"),
      beds: z.number().int().nonnegative().optional().describe("Bedroom count"),
      baths: z.number().nonnegative().optional().describe("Bathroom count"),
      squareFeet: z.number().int().nonnegative().optional().describe("Interior square footage"),
      lotSize: z.string().optional().describe("Lot size display text"),
      description: z.string().optional().describe("Listing description"),
      heroImage: z.string().optional().describe("Primary listing image URL"),
      videoUrl: z.string().optional().describe("Featured listing video URL"),
      gallery: z.array(z.object({
        url: z.string(),
        type: z.enum(["image", "video"]).optional(),
        alt: z.string().optional(),
      })).optional().describe("Listing gallery media items"),
      agentName: z.string().optional().describe("Listing agent name"),
      agentTitle: z.string().optional().describe("Listing agent title"),
      agentEmail: z.string().optional().describe("Listing agent email"),
      agentPhone: z.string().optional().describe("Listing agent phone"),
      agentWhatsapp: z.string().optional().describe("Listing agent WhatsApp URL"),
      agentPhotoUrl: z.string().optional().describe("Listing agent photo URL"),
      facebookUrl: z.string().optional().describe("Listing Facebook marketing URL"),
      instagramUrl: z.string().optional().describe("Listing Instagram marketing URL"),
      status: z.string().optional().describe("Listing status, such as active, pending, sold, or draft"),
      isFeatured: z.boolean().optional().describe("Whether the listing appears on the public homepage"),
      order: z.number().int().min(0).optional().describe("Display order for featured listings"),
    },
    async ({ title, address, city, region, neighborhood, municipality, postalCode, country, latitude, longitude, price, priceCurrency, beds, baths, squareFeet, lotSize, description, heroImage, videoUrl, gallery, agentName, agentTitle, agentEmail, agentPhone, agentWhatsapp, agentPhotoUrl, facebookUrl, instagramUrl, status, isFeatured, order }) => {
      const trimmedTitle = title.trim();
      const trimmedAddress = address.trim();
      const trimmedCity = city.trim();
      const trimmedPrice = price.trim();
      if (!trimmedTitle || !trimmedAddress || !trimmedCity) {
        return { content: [{ type: "text" as const, text: "Error: title, address, and city are required" }], isError: true };
      }
      if (!trimmedPrice) {
        return { content: [{ type: "text" as const, text: "Error: price is required" }], isError: true };
      }

      const listing = await prisma.listing.create({
        data: {
          title: trimmedTitle,
          slug: generateSlug(`${trimmedTitle}-${trimmedAddress}`),
          address: trimmedAddress,
          city: trimmedCity,
          state: region?.trim() || "Baja California",
          neighborhood: cleanNullableString(neighborhood) ?? null,
          municipality: cleanNullableString(municipality) ?? null,
          postalCode: cleanNullableString(postalCode) ?? null,
          country: country?.trim() || "MX",
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          price: trimmedPrice,
          priceAmount: parsePriceAmount(trimmedPrice),
          priceCurrency: priceCurrency ?? "USD",
          beds: beds ?? null,
          baths: baths ?? null,
          squareFeet: squareFeet ?? null,
          lotSize: cleanNullableString(lotSize) ?? null,
          description: cleanNullableString(description) ?? null,
          imageUrl: cleanNullableString(heroImage) ?? null,
          videoUrl: cleanNullableString(videoUrl) ?? null,
          gallery: gallery ?? undefined,
          agentName: cleanNullableString(agentName) ?? null,
          agentTitle: cleanNullableString(agentTitle) ?? null,
          agentEmail: cleanNullableString(agentEmail) ?? null,
          agentPhone: cleanNullableString(agentPhone) ?? null,
          agentWhatsapp: cleanNullableString(agentWhatsapp) ?? null,
          agentPhotoUrl: cleanNullableString(agentPhotoUrl) ?? null,
          facebookUrl: cleanNullableString(facebookUrl) ?? null,
          instagramUrl: cleanNullableString(instagramUrl) ?? null,
          status: status?.trim() || "active",
          isFeatured: isFeatured ?? true,
          order: order ?? 0,
        },
        select: listingSelect(),
      });

      return { content: [{ type: "text" as const, text: JSON.stringify(listing, null, 2) }] };
    },
  );

  server.tool(
    "update_listing",
    "Update a real estate listing",
    { listingId: z.string().describe("The listing ID"), ...listingPayload },
    async ({ listingId, title, address, city, region, neighborhood, municipality, postalCode, country, latitude, longitude, price, priceCurrency, beds, baths, squareFeet, lotSize, description, heroImage, videoUrl, gallery, agentName, agentTitle, agentEmail, agentPhone, agentWhatsapp, agentPhotoUrl, facebookUrl, instagramUrl, status, isFeatured, order }) => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) { const value = title.trim(); if (!value) return { content: [{ type: "text" as const, text: "Error: title cannot be empty" }], isError: true }; updateData.title = value; }
      if (address !== undefined) { const value = address.trim(); if (!value) return { content: [{ type: "text" as const, text: "Error: address cannot be empty" }], isError: true }; updateData.address = value; }
      if (city !== undefined) { const value = city.trim(); if (!value) return { content: [{ type: "text" as const, text: "Error: city cannot be empty" }], isError: true }; updateData.city = value; }
      if (region !== undefined) updateData.state = region.trim() || "Baja California";
      if (neighborhood !== undefined) updateData.neighborhood = cleanNullableString(neighborhood);
      if (municipality !== undefined) updateData.municipality = cleanNullableString(municipality);
      if (postalCode !== undefined) updateData.postalCode = cleanNullableString(postalCode);
      if (country !== undefined) updateData.country = country.trim() || "MX";
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;
      if (price !== undefined) {
        updateData.price = cleanNullableString(price);
        updateData.priceAmount = parsePriceAmount(price);
      }
      if (priceCurrency !== undefined) updateData.priceCurrency = priceCurrency;
      if (beds !== undefined) updateData.beds = beds;
      if (baths !== undefined) updateData.baths = baths;
      if (squareFeet !== undefined) updateData.squareFeet = squareFeet;
      if (lotSize !== undefined) updateData.lotSize = cleanNullableString(lotSize);
      if (description !== undefined) updateData.description = cleanNullableString(description);
      if (heroImage !== undefined) updateData.imageUrl = cleanNullableString(heroImage);
      if (videoUrl !== undefined) updateData.videoUrl = cleanNullableString(videoUrl);
      if (gallery !== undefined) updateData.gallery = gallery;
      if (agentName !== undefined) updateData.agentName = cleanNullableString(agentName);
      if (agentTitle !== undefined) updateData.agentTitle = cleanNullableString(agentTitle);
      if (agentEmail !== undefined) updateData.agentEmail = cleanNullableString(agentEmail);
      if (agentPhone !== undefined) updateData.agentPhone = cleanNullableString(agentPhone);
      if (agentWhatsapp !== undefined) updateData.agentWhatsapp = cleanNullableString(agentWhatsapp);
      if (agentPhotoUrl !== undefined) updateData.agentPhotoUrl = cleanNullableString(agentPhotoUrl);
      if (facebookUrl !== undefined) updateData.facebookUrl = cleanNullableString(facebookUrl);
      if (instagramUrl !== undefined) updateData.instagramUrl = cleanNullableString(instagramUrl);
      if (status !== undefined) updateData.status = status.trim() || "active";
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (order !== undefined) updateData.order = order;

      try {
        const listing = await prisma.listing.update({
          where: { id: listingId },
          data: updateData,
          select: listingSelect(),
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(listing, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Listing not found or update failed" }], isError: true };
      }
    },
  );

  server.tool(
    "delete_listing",
    "Delete a real estate listing",
    { listingId: z.string().describe("The listing ID") },
    async ({ listingId }) => {
      try {
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) return { content: [{ type: "text" as const, text: "Error: Listing not found" }], isError: true };
        await prisma.listing.delete({ where: { id: listingId } });
        return { content: [{ type: "text" as const, text: `Deleted listing "${listing.title}".` }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to delete listing" }], isError: true };
      }
    },
  );

  // -------------------------------------------------------------------------
  // Social Post Drafts
  // -------------------------------------------------------------------------

  server.tool("list_social_posts", "List social media post drafts and publication records", async () => {
    const posts = await prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { id: true, title: true, slug: true } } },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify({ total: posts.length, posts }, null, 2) }] };
  });

  server.tool(
    "create_social_post_from_listing",
    "Generate and store a social post draft from a listing for Facebook, Instagram, or manual posting",
    {
      listingId: z.string().describe("Listing ID"),
      platform: z.enum(["facebook", "instagram", "manual"]).optional().describe("Target platform"),
      tone: z.string().optional().describe("Optional tone guidance, e.g. luxury, investment, urgent"),
      targetPageId: z.string().optional().describe("Optional Facebook page ID"),
      targetAccountId: z.string().optional().describe("Optional Instagram business account ID"),
    },
    async ({ listingId, platform = "manual", tone, targetPageId, targetAccountId }) => {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) return { content: [{ type: "text" as const, text: "Error: Listing not found" }], isError: true };
      const draft = generateListingSocialPost(listing, platform, { tone });
      const post = await prisma.socialPost.create({
        data: {
          listingId,
          platform,
          caption: draft.caption,
          hashtags: draft.hashtags,
          mediaUrls: draft.mediaUrls,
          targetPageId: cleanNullableString(targetPageId),
          targetAccountId: cleanNullableString(targetAccountId),
        },
        include: { listing: { select: { id: true, title: true, slug: true } } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(post, null, 2) }] };
    },
  );

  server.tool(
    "create_social_post",
    "Create a custom social media post draft",
    {
      platform: z.enum(["facebook", "instagram", "manual"]).optional(),
      listingId: z.string().nullable().optional(),
      caption: z.string().describe("Post caption/copy"),
      hashtags: z.array(z.string()).optional(),
      mediaUrls: z.array(z.string()).optional(),
      status: z.enum(["draft", "approved", "published", "archived"]).optional(),
      targetPageId: z.string().nullable().optional(),
      targetAccountId: z.string().nullable().optional(),
    },
    async ({ platform = "manual", listingId, caption, hashtags = [], mediaUrls = [], status = "draft", targetPageId, targetAccountId }) => {
      const trimmedCaption = caption.trim();
      if (!trimmedCaption) return { content: [{ type: "text" as const, text: "Error: caption is required" }], isError: true };
      const post = await prisma.socialPost.create({
        data: {
          platform,
          listingId: cleanNullableString(listingId),
          caption: trimmedCaption,
          hashtags,
          mediaUrls,
          status,
          targetPageId: cleanNullableString(targetPageId),
          targetAccountId: cleanNullableString(targetAccountId),
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(post, null, 2) }] };
    },
  );

  server.tool(
    "update_social_post",
    "Update a stored social post draft",
    {
      postId: z.string(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      mediaUrls: z.array(z.string()).optional(),
      status: z.enum(["draft", "approved", "published", "archived"]).optional(),
      publishedUrl: z.string().nullable().optional(),
    },
    async ({ postId, caption, hashtags, mediaUrls, status, publishedUrl }) => {
      const data: Record<string, unknown> = {};
      if (caption !== undefined) data.caption = caption;
      if (hashtags !== undefined) data.hashtags = hashtags;
      if (mediaUrls !== undefined) data.mediaUrls = mediaUrls;
      if (status !== undefined) data.status = status;
      if (publishedUrl !== undefined) data.publishedUrl = cleanNullableString(publishedUrl);
      if (status === "published") data.publishedAt = new Date();
      try {
        const post = await prisma.socialPost.update({ where: { id: postId }, data });
        return { content: [{ type: "text" as const, text: JSON.stringify(post, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to update social post" }], isError: true };
      }
    },
  );

  server.tool(
    "list_facebook_pages",
    "List connected Facebook pages from the Meta integration and show the currently selected default page",
    async () => {
      const connection = await prisma.metaConnection.findFirst({ orderBy: { updatedAt: "desc" } });
      if (!connection) {
        return { content: [{ type: "text" as const, text: "No Meta connection found. Connect Meta in Admin > Integrations first." }], isError: true };
      }
      const pages = Array.isArray(connection.pages)
        ? (connection.pages as Array<{ id: string; name: string; access_token?: string }>).map((page) => ({
            id: page.id,
            name: page.name,
          }))
        : [];
      return { content: [{ type: "text" as const, text: JSON.stringify({ selectedPageId: connection.selectedPageId, pages }, null, 2) }] };
    },
  );

  server.tool(
    "set_default_facebook_page",
    "Set the default connected Facebook page used when publishing social posts without a per-post targetPageId",
    { pageId: z.string().describe("Facebook page ID returned by list_facebook_pages") },
    async ({ pageId }) => {
      const connection = await prisma.metaConnection.findFirst({ orderBy: { updatedAt: "desc" } });
      if (!connection) {
        return { content: [{ type: "text" as const, text: "Error: No Meta connection found. Connect Meta in Admin > Integrations first." }], isError: true };
      }
      const pages = Array.isArray(connection.pages)
        ? connection.pages as Array<{ id: string; name: string; access_token?: string }>
        : [];
      const selectedPage = pages.find((page) => page.id === pageId);
      if (!selectedPage) {
        return { content: [{ type: "text" as const, text: `Error: Page ${pageId} was not found in the connected Meta account.` }], isError: true };
      }
      const updated = await prisma.metaConnection.update({
        where: { id: connection.id },
        data: { selectedPageId: pageId },
        select: { selectedPageId: true, providerUserName: true },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ ...updated, selectedPage: { id: selectedPage.id, name: selectedPage.name } }, null, 2) }] };
    },
  );

  server.tool(
    "publish_social_post_to_facebook",
    "Attempt to publish a stored post to a configured Facebook page. Requires FACEBOOK_PAGE_ACCESS_TOKEN and targetPageId.",
    { postId: z.string() },
    async ({ postId }) => {
      const post = await prisma.socialPost.findUnique({ where: { id: postId } });
      if (!post) return { content: [{ type: "text" as const, text: "Error: Social post not found" }], isError: true };
      const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      const pageId = post.targetPageId || process.env.FACEBOOK_PAGE_ID;
      const connection = await prisma.metaConnection.findFirst({ orderBy: { updatedAt: "desc" } });
      const connectedPages = connection && Array.isArray(connection.pages)
        ? connection.pages as Array<{ id: string; name: string; access_token?: string }>
        : [];
      const connectedPage = connectedPages.find((page) => page.id === (post.targetPageId || connection?.selectedPageId)) || connectedPages[0];
      const accessToken = connectedPage?.access_token || token;
      const resolvedPageId = connectedPage?.id || pageId;
      if (!accessToken) {
        return { content: [{ type: "text" as const, text: "Error: No Meta page access token is configured. Connect Meta in Admin > Integrations or set FACEBOOK_PAGE_ACCESS_TOKEN." }], isError: true };
      }
      if (!resolvedPageId) return { content: [{ type: "text" as const, text: "Error: No Facebook page ID configured on post, Meta connection, or FACEBOOK_PAGE_ID." }], isError: true };

      const imageUrl = (post.mediaUrls || []).find((url) =>
        /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)
      );
      const endpoint = imageUrl ? "photos" : "feed";
      const payload = imageUrl
        ? {
            url: imageUrl,
            caption: [post.caption, ...(post.hashtags || [])].join("\n\n"),
            access_token: accessToken,
          }
        : {
            message: [post.caption, ...(post.hashtags || [])].join("\n\n"),
            access_token: accessToken,
          };

      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${resolvedPageId}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
          return { content: [{ type: "text" as const, text: `Error publishing to Facebook: ${JSON.stringify(result)}` }], isError: true };
        }
        const updated = await prisma.socialPost.update({
          where: { id: postId },
          data: {
            status: "published",
            publishedAt: new Date(),
            publishedUrl: result.id ? `https://www.facebook.com/${result.id}` : null,
          },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(updated, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error publishing to Facebook: ${error instanceof Error ? error.message : "unknown error"}` }], isError: true };
      }
    },
  );

  server.tool(
    "search_listings",
    "Search listings by title, address, city, description, or status",
    { query: z.string().describe("Search term") },
    async ({ query }) => {
      const listings = await prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { status: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        select: listingSelect(),
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ total: listings.length, listings }, null, 2) }] };
    },
  );

  // -------------------------------------------------------------------------
  // Client Management
  // -------------------------------------------------------------------------

  server.tool("list_clients", "List all client packages with their asset counts and package status", async () => {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, slug: true, packageType: true, projectStatus: true, interestSummary: true, sellerReport: true, isActive: true, isPublic: true, createdAt: true, updatedAt: true, _count: { select: { photos: true, listings: true } } },
    });
    const result = clients.map((c) => ({ id: c.id, name: c.name, email: c.email, slug: c.slug, packageType: c.packageType, projectStatus: c.projectStatus, interestSummary: c.interestSummary, sellerReport: c.sellerReport, isActive: c.isActive, isPublic: c.isPublic, assetCount: c._count.photos, listingCount: c._count.listings, createdAt: fmt(c.createdAt), updatedAt: fmt(c.updatedAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.tool("list_client_packages", "List all buyer and seller client packages", async () => {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, slug: true, packageType: true, projectStatus: true, interestSummary: true, sellerReport: true, isActive: true, isPublic: true, createdAt: true, updatedAt: true, _count: { select: { photos: true, listings: true } } },
    });
    const result = clients.map((c) => ({ id: c.id, name: c.name, email: c.email, slug: c.slug, packageType: c.packageType, projectStatus: c.projectStatus, interestSummary: c.interestSummary, sellerReport: c.sellerReport, isActive: c.isActive, isPublic: c.isPublic, assetCount: c._count.photos, listingCount: c._count.listings, createdAt: fmt(c.createdAt), updatedAt: fmt(c.updatedAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.tool("list_buyer_clients", "List buyer clients and their curated-property communication status", async () => {
    const clients = await prisma.client.findMany({
      where: { packageType: "buyer" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, slug: true, packageType: true, projectStatus: true, interestSummary: true, isActive: true, isPublic: true, createdAt: true, updatedAt: true, _count: { select: { photos: true, listings: true } } },
    });
    const result = clients.map((c) => ({ id: c.id, name: c.name, email: c.email, slug: c.slug, projectStatus: c.projectStatus, interestSummary: c.interestSummary, isActive: c.isActive, isPublic: c.isPublic, assetCount: c._count.photos, curatedListingCount: c._count.listings, createdAt: fmt(c.createdAt), updatedAt: fmt(c.updatedAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.tool("list_seller_clients", "List seller clients and their listing/status communication state", async () => {
    const clients = await prisma.client.findMany({
      where: { packageType: "seller" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, slug: true, packageType: true, projectStatus: true, interestSummary: true, sellerReport: true, isActive: true, isPublic: true, createdAt: true, updatedAt: true, _count: { select: { photos: true, listings: true } } },
    });
    const result = clients.map((c) => ({ id: c.id, name: c.name, email: c.email, slug: c.slug, projectStatus: c.projectStatus, interestSummary: c.interestSummary, sellerReport: c.sellerReport, isActive: c.isActive, isPublic: c.isPublic, assetCount: c._count.photos, linkedListingCount: c._count.listings, createdAt: fmt(c.createdAt), updatedAt: fmt(c.updatedAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.tool("get_client", "Get detailed information about a specific client package including assets and curated listings", { clientId: z.string().describe("The client/package ID") }, async ({ clientId }) => {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true, email: true, slug: true, packageType: true, projectStatus: true, interestSummary: true, sellerReport: true, isActive: true, isPublic: true, createdAt: true, updatedAt: true, photos: { orderBy: { order: "asc" }, select: { id: true, url: true, filename: true, order: true, width: true, height: true, createdAt: true } }, listings: { orderBy: { order: "asc" }, select: { id: true, note: true, order: true, listing: { select: listingSelect() } } } } });
    if (!client) return { content: [{ type: "text" as const, text: "Error: Client not found" }], isError: true };
    return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
  });

  server.tool("get_client_package", "Get a buyer or seller client package with assets, curated listings, and status fields", { clientId: z.string().describe("The client/package ID") }, async ({ clientId }) => {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: clientSelect() });
    if (!client) return { content: [{ type: "text" as const, text: "Error: Client package not found" }], isError: true };
    return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
  });

  server.tool("create_client", "Create a new buyer or seller package with optional curated listings", { name: z.string().describe("Client/package name"), email: z.string().optional().describe("Client email (optional)"), password: z.string().describe("Package access password"), packageType: z.enum(["buyer", "seller"]).optional().describe("Package type"), projectStatus: z.string().optional().describe("Project/listing status visible to the client"), interestSummary: z.string().nullable().optional().describe("Interest/showing/lead summary visible to the client"), sellerReport: z.string().nullable().optional().describe("Read-only seller update/report visible to seller clients"), listingIds: z.array(z.string()).optional().describe("Curated listing IDs for this package") }, async ({ name, email, password, packageType, projectStatus, interestSummary, sellerReport, listingIds }) => {
    const trimmedName = name.trim();
    if (!trimmedName) return { content: [{ type: "text" as const, text: "Error: Name is required" }], isError: true };
    const normalizedEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : null;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { content: [{ type: "text" as const, text: "Error: Invalid email format" }], isError: true };
    const hashedPassword = await bcrypt.hash(password, 12);
    const slug = generateSlug(trimmedName);
    const normalizedPackageType = packageType ?? "buyer";
    const ids = [...new Set(listingIds ?? [])];
    const client = await prisma.client.create({ data: { name: trimmedName, email: normalizedEmail, password: hashedPassword, slug, packageType: normalizedPackageType, projectStatus: projectStatus?.trim() || (normalizedPackageType === "seller" ? "Preparing listing" : "Curating properties"), interestSummary: cleanNullableString(interestSummary), sellerReport: cleanNullableString(sellerReport), listings: ids.length > 0 ? { create: ids.map((listingId, order) => ({ listingId, order })) } : undefined } });
    return { content: [{ type: "text" as const, text: JSON.stringify({ id: client.id, name: client.name, email: client.email, slug: client.slug, isActive: client.isActive, createdAt: fmt(client.createdAt) }, null, 2) }] };
  });

  server.tool("create_buyer_client", "Create a buyer client for private curated property recommendations", { name: z.string().describe("Buyer client name"), email: z.string().optional().describe("Buyer email (optional)"), password: z.string().describe("Client portal password"), projectStatus: z.string().optional().describe("Buying journey status visible to the client"), interestSummary: z.string().nullable().optional().describe("Buying notes or communication summary"), listingIds: z.array(z.string()).optional().describe("Curated listing IDs for this buyer") }, async ({ name, email, password, projectStatus, interestSummary, listingIds }) => {
    const trimmedName = name.trim();
    if (!trimmedName) return { content: [{ type: "text" as const, text: "Error: Name is required" }], isError: true };
    const normalizedEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : null;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { content: [{ type: "text" as const, text: "Error: Invalid email format" }], isError: true };
    const ids = [...new Set(listingIds ?? [])];
    const client = await prisma.client.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        slug: generateSlug(trimmedName),
        packageType: "buyer",
        projectStatus: projectStatus?.trim() || "Curating properties",
        interestSummary: cleanNullableString(interestSummary),
        listings: ids.length > 0 ? { create: ids.map((listingId, order) => ({ listingId, order })) } : undefined,
      },
      select: clientSelect(),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
  });

  server.tool("create_seller_client", "Create a seller client for read-only listing status and interest updates", { name: z.string().describe("Seller client name"), email: z.string().optional().describe("Seller email (optional)"), password: z.string().describe("Client portal password"), projectStatus: z.string().optional().describe("Listing project status visible to the seller"), interestSummary: z.string().nullable().optional().describe("Showing, inquiry, and buyer-interest summary"), sellerReport: z.string().nullable().optional().describe("Seller-facing report/update"), listingIds: z.array(z.string()).optional().describe("Seller listing IDs, usually one primary property") }, async ({ name, email, password, projectStatus, interestSummary, sellerReport, listingIds }) => {
    const trimmedName = name.trim();
    if (!trimmedName) return { content: [{ type: "text" as const, text: "Error: Name is required" }], isError: true };
    const normalizedEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : null;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { content: [{ type: "text" as const, text: "Error: Invalid email format" }], isError: true };
    const ids = [...new Set(listingIds ?? [])];
    const client = await prisma.client.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        slug: generateSlug(trimmedName),
        packageType: "seller",
        projectStatus: projectStatus?.trim() || "Preparing listing",
        interestSummary: cleanNullableString(interestSummary),
        sellerReport: cleanNullableString(sellerReport),
        listings: ids.length > 0 ? { create: ids.map((listingId, order) => ({ listingId, order })) } : undefined,
      },
      select: clientSelect(),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
  });

  server.tool("update_client", "Update a client package, seller status/report, buyer curated listings, or access settings", { clientId: z.string().describe("The client/package ID"), name: z.string().optional().describe("New name"), email: z.string().nullable().optional().describe("New email or null to remove"), password: z.string().optional().describe("New package password"), packageType: z.enum(["buyer", "seller"]).optional().describe("Package type"), projectStatus: z.string().optional().describe("Project/listing status visible to the client"), interestSummary: z.string().nullable().optional().describe("Interest/showing/lead summary visible to the client"), sellerReport: z.string().nullable().optional().describe("Read-only seller update/report visible to seller clients"), listingIds: z.array(z.string()).optional().describe("Replace curated listing IDs for this package"), isActive: z.boolean().optional().describe("Whether package is active"), isPublic: z.boolean().optional().describe("Whether package link can be accessed without password") }, async ({ clientId, name, email, password, packageType, projectStatus, interestSummary, sellerReport, listingIds, isActive, isPublic }) => {
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) { const t = name.trim(); if (!t) return { content: [{ type: "text" as const, text: "Error: Name cannot be empty" }], isError: true }; updateData.name = t; }
    if (email !== undefined) { if (email === null || email === "") { updateData.email = null; } else { const n = email.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return { content: [{ type: "text" as const, text: "Error: Invalid email format" }], isError: true }; updateData.email = n; } }
    if (password !== undefined) updateData.password = await bcrypt.hash(password, 12);
    if (packageType !== undefined) updateData.packageType = packageType;
    if (projectStatus !== undefined) { const t = projectStatus.trim(); if (!t) return { content: [{ type: "text" as const, text: "Error: projectStatus cannot be empty" }], isError: true }; updateData.projectStatus = t; }
    if (interestSummary !== undefined) updateData.interestSummary = cleanNullableString(interestSummary);
    if (sellerReport !== undefined) updateData.sellerReport = cleanNullableString(sellerReport);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    try {
      const client = await prisma.$transaction(async (tx) => {
        if (listingIds !== undefined) {
          const ids = [...new Set(listingIds)];
          await tx.clientListing.deleteMany({ where: { clientId } });
          if (ids.length > 0) await tx.clientListing.createMany({ data: ids.map((listingId, order) => ({ clientId, listingId, order })), skipDuplicates: true });
        }
        return tx.client.update({ where: { id: clientId }, data: updateData, select: { id: true, name: true, email: true, slug: true, packageType: true, projectStatus: true, interestSummary: true, sellerReport: true, isActive: true, isPublic: true, createdAt: true, updatedAt: true, listings: { orderBy: { order: "asc" }, select: { listing: { select: listingSelect() } } } } });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
    } catch { return { content: [{ type: "text" as const, text: "Error: Client not found or update failed" }], isError: true }; }
  });

  server.tool("delete_client", "Permanently delete a client and all their photos", { clientId: z.string().describe("The client ID to delete") }, async ({ clientId }) => {
    try {
      const client = await prisma.client.findUnique({ where: { id: clientId }, include: { photos: true } });
      if (!client) return { content: [{ type: "text" as const, text: "Error: Client not found" }], isError: true };
      await prisma.client.delete({ where: { id: clientId } });
      return { content: [{ type: "text" as const, text: `Deleted client "${client.name}" and ${client.photos.length} photo(s).` }] };
    } catch { return { content: [{ type: "text" as const, text: "Error: Failed to delete client" }], isError: true }; }
  });

  server.tool(
    "set_client_package_listings",
    "Replace the curated property listings attached to a buyer or seller package",
    {
      clientId: z.string().describe("The client/package ID"),
      listingIds: z.array(z.string()).describe("Listing IDs in display order"),
    },
    async ({ clientId, listingIds }) => {
      const uniqueListingIds = [...new Set(listingIds)];
      try {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) return { content: [{ type: "text" as const, text: "Error: Client package not found" }], isError: true };
        await prisma.$transaction(async (tx) => {
          await tx.clientListing.deleteMany({ where: { clientId } });
          if (uniqueListingIds.length > 0) {
            await tx.clientListing.createMany({
              data: uniqueListingIds.map((listingId, order) => ({ clientId, listingId, order })),
              skipDuplicates: true,
            });
          }
        });
        return { content: [{ type: "text" as const, text: `Updated curated listings for "${client.name}".` }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to update curated listings" }], isError: true };
      }
    },
  );

  server.tool(
    "update_buyer_client_curation",
    "Update a buyer client's curated listings and buying journey notes",
    {
      clientId: z.string().describe("The buyer client ID"),
      listingIds: z.array(z.string()).optional().describe("Curated listing IDs in display order"),
      projectStatus: z.string().optional().describe("Buying journey status visible to the client"),
      interestSummary: z.string().nullable().optional().describe("Private buying notes or communication summary"),
    },
    async ({ clientId, listingIds, projectStatus, interestSummary }) => {
      const updateData: Record<string, unknown> = { packageType: "buyer" };
      if (projectStatus !== undefined) {
        const value = projectStatus.trim();
        if (!value) return { content: [{ type: "text" as const, text: "Error: projectStatus cannot be empty" }], isError: true };
        updateData.projectStatus = value;
      }
      if (interestSummary !== undefined) updateData.interestSummary = cleanNullableString(interestSummary);
      try {
        const client = await prisma.$transaction(async (tx) => {
          if (listingIds !== undefined) {
            const ids = [...new Set(listingIds)];
            await tx.clientListing.deleteMany({ where: { clientId } });
            if (ids.length > 0) {
              await tx.clientListing.createMany({ data: ids.map((listingId, order) => ({ clientId, listingId, order })), skipDuplicates: true });
            }
          }
          return tx.client.update({ where: { id: clientId }, data: updateData, select: clientSelect() });
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to update buyer client curation" }], isError: true };
      }
    },
  );

  server.tool(
    "update_client_package_status",
    "Update buyer/seller package status, interest summary, and seller-facing report",
    {
      clientId: z.string().describe("The client/package ID"),
      projectStatus: z.string().optional().describe("Project/listing status visible to the client"),
      interestSummary: z.string().nullable().optional().describe("Interest/showing/inquiry summary visible to the client"),
      sellerReport: z.string().nullable().optional().describe("Read-only seller report visible to seller packages"),
    },
    async ({ clientId, projectStatus, interestSummary, sellerReport }) => {
      const updateData: Record<string, unknown> = {};
      if (projectStatus !== undefined) {
        const value = projectStatus.trim();
        if (!value) return { content: [{ type: "text" as const, text: "Error: projectStatus cannot be empty" }], isError: true };
        updateData.projectStatus = value;
      }
      if (interestSummary !== undefined) updateData.interestSummary = cleanNullableString(interestSummary);
      if (sellerReport !== undefined) updateData.sellerReport = cleanNullableString(sellerReport);

      try {
        const client = await prisma.client.update({
          where: { id: clientId },
          data: updateData,
          select: clientSelect(),
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to update client package status" }], isError: true };
      }
    },
  );

  server.tool(
    "update_seller_client_status",
    "Update a seller client's listing status, interest summary, seller report, and linked listing",
    {
      clientId: z.string().describe("The seller client ID"),
      listingIds: z.array(z.string()).optional().describe("Linked seller listing IDs, usually one primary property"),
      projectStatus: z.string().optional().describe("Listing project status visible to the seller"),
      interestSummary: z.string().nullable().optional().describe("Showing, inquiry, lead, and buyer-interest summary"),
      sellerReport: z.string().nullable().optional().describe("Read-only seller update/report"),
    },
    async ({ clientId, listingIds, projectStatus, interestSummary, sellerReport }) => {
      const updateData: Record<string, unknown> = { packageType: "seller" };
      if (projectStatus !== undefined) {
        const value = projectStatus.trim();
        if (!value) return { content: [{ type: "text" as const, text: "Error: projectStatus cannot be empty" }], isError: true };
        updateData.projectStatus = value;
      }
      if (interestSummary !== undefined) updateData.interestSummary = cleanNullableString(interestSummary);
      if (sellerReport !== undefined) updateData.sellerReport = cleanNullableString(sellerReport);
      try {
        const client = await prisma.$transaction(async (tx) => {
          if (listingIds !== undefined) {
            const ids = [...new Set(listingIds)];
            await tx.clientListing.deleteMany({ where: { clientId } });
            if (ids.length > 0) {
              await tx.clientListing.createMany({ data: ids.map((listingId, order) => ({ clientId, listingId, order })), skipDuplicates: true });
            }
          }
          return tx.client.update({ where: { id: clientId }, data: updateData, select: clientSelect() });
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(client, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to update seller client status" }], isError: true };
      }
    },
  );

  // -------------------------------------------------------------------------
  // Client Photo Management
  // -------------------------------------------------------------------------

  server.tool("list_client_photos", "List all photos for a specific client", { clientId: z.string().describe("The client ID") }, async ({ clientId }) => {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } });
    if (!client) return { content: [{ type: "text" as const, text: "Error: Client not found" }], isError: true };
    const photos = await prisma.photo.findMany({ where: { clientId }, orderBy: { order: "asc" }, select: { id: true, url: true, filename: true, order: true, width: true, height: true, createdAt: true } });
    return { content: [{ type: "text" as const, text: JSON.stringify({ client: client.name, totalPhotos: photos.length, photos }, null, 2) }] };
  });

  server.tool("delete_photo", "Delete a specific photo from a client's gallery", { photoId: z.string().describe("The photo ID to delete") }, async ({ photoId }) => {
    try {
      const photo = await prisma.photo.findUnique({ where: { id: photoId } });
      if (!photo) return { content: [{ type: "text" as const, text: "Error: Photo not found" }], isError: true };
      if (process.env.BLOB_READ_WRITE_TOKEN) { try { const { del } = await import("@vercel/blob"); await del(photo.url); } catch (e) { console.error("Failed to delete blob:", e); } }
      await prisma.photo.delete({ where: { id: photoId } });
      return { content: [{ type: "text" as const, text: `Deleted photo "${photo.filename}".` }] };
    } catch { return { content: [{ type: "text" as const, text: "Error: Failed to delete photo" }], isError: true }; }
  });

  server.tool("reorder_photos", "Reorder photos in a client's gallery", { clientId: z.string().describe("The client ID"), photoIds: z.array(z.string()).describe("Photo IDs in desired order") }, async ({ clientId, photoIds }) => {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { content: [{ type: "text" as const, text: "Error: Client not found" }], isError: true };
    try { await prisma.$transaction(photoIds.map((id, i) => prisma.photo.update({ where: { id }, data: { order: i } }))); return { content: [{ type: "text" as const, text: `Reordered ${photoIds.length} photos for "${client.name}".` }] }; } catch { return { content: [{ type: "text" as const, text: "Error: Failed to reorder photos" }], isError: true }; }
  });

  // -------------------------------------------------------------------------
  // Portfolio Management
  // -------------------------------------------------------------------------

  server.tool("list_portfolio", "List all featured listing media on the public website", async () => {
    const photos = await prisma.portfolioPhoto.findMany({ orderBy: { order: "asc" } });
    const result = photos.map((p) => ({ id: p.id, url: p.url, filename: p.filename, caption: p.caption, order: p.order, width: p.width, height: p.height, createdAt: fmt(p.createdAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify({ totalPhotos: result.length, photos: result }, null, 2) }] };
  });

  server.tool("update_portfolio_photo", "Update a featured listing asset's caption or display order", { photoId: z.string().describe("The listing media ID"), caption: z.string().nullable().optional().describe("New caption or null to remove"), order: z.number().int().min(0).optional().describe("New display order") }, async ({ photoId, caption, order }) => {
    const updateData: Record<string, unknown> = {};
    if (caption !== undefined) updateData.caption = caption;
    if (order !== undefined) updateData.order = order;
    try { const photo = await prisma.portfolioPhoto.update({ where: { id: photoId }, data: updateData }); return { content: [{ type: "text" as const, text: JSON.stringify({ id: photo.id, url: photo.url, filename: photo.filename, caption: photo.caption, order: photo.order }, null, 2) }] }; } catch { return { content: [{ type: "text" as const, text: "Error: Portfolio photo not found or update failed" }], isError: true }; }
  });

  server.tool("delete_portfolio_photo", "Delete media from the public featured listings", { photoId: z.string().describe("The listing media ID") }, async ({ photoId }) => {
    try {
      const photo = await prisma.portfolioPhoto.findUnique({ where: { id: photoId } });
      if (!photo) return { content: [{ type: "text" as const, text: "Error: Portfolio photo not found" }], isError: true };
      if (process.env.BLOB_READ_WRITE_TOKEN) { try { const { del } = await import("@vercel/blob"); await del(photo.url); } catch (e) { console.error("Failed to delete blob:", e); } }
      await prisma.portfolioPhoto.delete({ where: { id: photoId } });
      return { content: [{ type: "text" as const, text: `Deleted listing media "${photo.filename}".` }] };
    } catch { return { content: [{ type: "text" as const, text: "Error: Failed to delete listing media" }], isError: true }; }
  });

  server.tool("reorder_portfolio", "Reorder featured listing media", { photoIds: z.array(z.string()).describe("Listing media IDs in desired order") }, async ({ photoIds }) => {
    try { await prisma.$transaction(photoIds.map((id, i) => prisma.portfolioPhoto.update({ where: { id }, data: { order: i } }))); return { content: [{ type: "text" as const, text: `Reordered ${photoIds.length} listing assets.` }] }; } catch { return { content: [{ type: "text" as const, text: "Error: Failed to reorder featured listings" }], isError: true }; }
  });

  // -------------------------------------------------------------------------
  // Content Hub / Blog
  // -------------------------------------------------------------------------

  server.tool(
    "list_content_posts",
    "List blog/content hub posts, optionally including drafts",
    {
      includeDrafts: z.boolean().optional().describe("Include draft posts"),
    },
    async ({ includeDrafts = true }) => {
      const posts = await prisma.contentPost.findMany({
        where: includeDrafts ? undefined : { status: "published" },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ total: posts.length, posts }, null, 2) }] };
    },
  );

  server.tool(
    "get_content_post",
    "Get a blog/content hub post by ID or slug",
    {
      id: z.string().optional().describe("Content post ID"),
      slug: z.string().optional().describe("Content post slug"),
    },
    async ({ id, slug }) => {
      const post = id
        ? await prisma.contentPost.findUnique({ where: { id } })
        : slug
          ? await prisma.contentPost.findUnique({ where: { slug } })
          : null;
      if (!post) return { content: [{ type: "text" as const, text: "Error: Content post not found" }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(post, null, 2) }] };
    },
  );

  server.tool(
    "create_content_post",
    "Create a blog/content hub post for the public insights section",
    {
      title: z.string().describe("Post title"),
      slug: z.string().optional().describe("Optional URL slug. Generated from title if omitted."),
      description: z.string().nullable().optional().describe("SEO/page description"),
      excerpt: z.string().nullable().optional().describe("Card excerpt"),
      body: z.string().describe("Post body as HTML or plain text"),
      category: z.string().nullable().optional().describe("Post category"),
      authorName: z.string().nullable().optional().describe("Optional author display name"),
      imageUrl: z.string().nullable().optional().describe("Optional image URL"),
      status: z.enum(["draft", "published"]).optional().describe("Post status"),
      metaTitle: z.string().nullable().optional().describe("Optional SEO title"),
      metaDescription: z.string().nullable().optional().describe("Optional SEO description"),
      publishedAt: z.string().nullable().optional().describe("Optional ISO publish date"),
    },
    async ({ title, slug, description, excerpt, body, category, authorName, imageUrl, status = "draft", metaTitle, metaDescription, publishedAt }) => {
      const cleanTitle = title.trim();
      const baseSlug = (slug?.trim() || cleanTitle)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      if (!cleanTitle || !baseSlug) return { content: [{ type: "text" as const, text: "Error: title is required" }], isError: true };
      let finalSlug = baseSlug;
      let suffix = 2;
      while (await prisma.contentPost.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${suffix++}`;
      }
      const post = await prisma.contentPost.create({
        data: {
          title: cleanTitle,
          slug: finalSlug,
          description: cleanNullableString(description),
          excerpt: cleanNullableString(excerpt),
          body: body.trim(),
          category: cleanNullableString(category) || "Market Insight",
          authorName: cleanNullableString(authorName),
          imageUrl: cleanNullableString(imageUrl),
          status,
          metaTitle: cleanNullableString(metaTitle),
          metaDescription: cleanNullableString(metaDescription),
          publishedAt: status === "published" ? (publishedAt ? new Date(publishedAt) : new Date()) : (publishedAt ? new Date(publishedAt) : null),
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(post, null, 2) }] };
    },
  );

  server.tool(
    "update_content_post",
    "Update a blog/content hub post",
    {
      id: z.string().describe("Content post ID"),
      title: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().nullable().optional(),
      excerpt: z.string().nullable().optional(),
      body: z.string().optional(),
      category: z.string().nullable().optional(),
      authorName: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      status: z.enum(["draft", "published"]).optional(),
      metaTitle: z.string().nullable().optional(),
      metaDescription: z.string().nullable().optional(),
      publishedAt: z.string().nullable().optional(),
    },
    async ({ id, title, slug, description, excerpt, body, category, authorName, imageUrl, status, metaTitle, metaDescription, publishedAt }) => {
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title.trim();
      if (slug !== undefined) {
        const baseSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (baseSlug) data.slug = baseSlug;
      }
      if (description !== undefined) data.description = cleanNullableString(description);
      if (excerpt !== undefined) data.excerpt = cleanNullableString(excerpt);
      if (body !== undefined) data.body = body.trim();
      if (category !== undefined) data.category = cleanNullableString(category);
      if (authorName !== undefined) data.authorName = cleanNullableString(authorName);
      if (imageUrl !== undefined) data.imageUrl = cleanNullableString(imageUrl);
      if (status !== undefined) data.status = status;
      if (metaTitle !== undefined) data.metaTitle = cleanNullableString(metaTitle);
      if (metaDescription !== undefined) data.metaDescription = cleanNullableString(metaDescription);
      if (publishedAt !== undefined) data.publishedAt = publishedAt ? new Date(publishedAt) : null;
      try {
        const post = await prisma.contentPost.update({ where: { id }, data });
        return { content: [{ type: "text" as const, text: JSON.stringify(post, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to update content post" }], isError: true };
      }
    },
  );

  server.tool(
    "delete_content_post",
    "Delete a blog/content hub post",
    { id: z.string().describe("Content post ID") },
    async ({ id }) => {
      try {
        await prisma.contentPost.delete({ where: { id } });
        return { content: [{ type: "text" as const, text: "Deleted content post." }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to delete content post" }], isError: true };
      }
    },
  );

  // -------------------------------------------------------------------------
  // Website Content
  // -------------------------------------------------------------------------

  server.tool("get_site_content", "Get all website content including hero, about, contact, and brand settings", async () => {
    const rows = await prisma.siteContent.findMany();
    const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
    for (const row of rows) content[row.key] = row.value;
    return { content: [{ type: "text" as const, text: JSON.stringify(content, null, 2) }] };
  });

  server.tool("update_site_content", "Update website content by providing key-value pairs. Valid keys include hero_*, about_*, contact_*, brand_*, footer_*, social_*", { updates: z.record(z.string(), z.string()).describe("Key-value pairs to update") }, async ({ updates }) => {
    const validKeys = Object.keys(SITE_CONTENT_DEFAULTS);
    const validUpdates: { key: string; value: string }[] = [];
    for (const [key, value] of Object.entries(updates)) if (validKeys.includes(key)) validUpdates.push({ key, value });
    if (validUpdates.length === 0) return { content: [{ type: "text" as const, text: "Error: No valid keys. Valid keys: " + validKeys.join(", ") }], isError: true };
    await prisma.$transaction(validUpdates.map(({ key, value }) => prisma.siteContent.upsert({ where: { key }, update: { value }, create: { key, value } })));
    const rows = await prisma.siteContent.findMany();
    const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
    for (const row of rows) content[row.key] = row.value;
    return { content: [{ type: "text" as const, text: `Updated ${validUpdates.length} field(s): ${validUpdates.map((u) => u.key).join(", ")}\n\n` + JSON.stringify(content, null, 2) }] };
  });

  server.tool("get_seo_settings", "Get website SEO and metadata settings", async () => {
    const rows = await prisma.siteContent.findMany();
    const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
    for (const row of rows) content[row.key] = row.value;
    const seo = Object.fromEntries(Object.entries(content).filter(([key]) => key.startsWith("seo_")));
    return { content: [{ type: "text" as const, text: JSON.stringify(seo, null, 2) }] };
  });

  server.tool(
    "update_seo_settings",
    "Update website SEO and metadata settings",
    { updates: z.record(z.string(), z.string()).describe("SEO key-value pairs to update. Keys must start with seo_.") },
    async ({ updates }) => {
      const validKeys = Object.keys(SITE_CONTENT_DEFAULTS).filter((key) => key.startsWith("seo_"));
      const validUpdates: { key: string; value: string }[] = [];
      for (const [key, value] of Object.entries(updates)) {
        if (validKeys.includes(key)) validUpdates.push({ key, value });
      }
      if (validUpdates.length === 0) {
        return { content: [{ type: "text" as const, text: "Error: No valid SEO keys. Valid keys: " + validKeys.join(", ") }], isError: true };
      }
      await prisma.$transaction(validUpdates.map(({ key, value }) => prisma.siteContent.upsert({ where: { key }, update: { value }, create: { key, value } })));
      const rows = await prisma.siteContent.findMany();
      const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
      for (const row of rows) content[row.key] = row.value;
      const seo = Object.fromEntries(Object.entries(content).filter(([key]) => key.startsWith("seo_")));
      return { content: [{ type: "text" as const, text: `Updated ${validUpdates.length} SEO field(s).\n\n` + JSON.stringify(seo, null, 2) }] };
    },
  );

  // -------------------------------------------------------------------------
  // SEO Rank Tracking / Reporting
  // -------------------------------------------------------------------------

  server.tool(
    "add_seo_keyword",
    "Add or update a keyword that should be tracked for search rankings",
    {
      keyword: z.string().describe("Keyword phrase to track"),
      targetUrl: z.string().nullable().optional().describe("Target page URL/path, such as /listings or a listing URL"),
      locale: z.string().optional().describe("Language/locale note, e.g. en-US or es-MX"),
      market: z.string().nullable().optional().describe("Search market/location, e.g. Ensenada, Baja California"),
      priority: z.number().int().min(0).optional().describe("Higher priority keywords appear first in reports"),
      notes: z.string().nullable().optional().describe("Optional notes about the keyword strategy"),
    },
    async ({ keyword, targetUrl, locale = "en-US", market, priority = 0, notes }) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const normalizedMarket = cleanNullableString(market) || locale;
      const device = "desktop";
      if (!normalizedKeyword) {
        return { content: [{ type: "text" as const, text: "Error: keyword is required" }], isError: true };
      }
      const row = await prisma.seoKeyword.upsert({
        where: {
          keyword_locale_market_device: {
            keyword: normalizedKeyword,
            locale,
            market: normalizedMarket,
            device,
          },
        },
        update: {
          targetUrl: cleanNullableString(targetUrl),
          market: normalizedMarket,
          priority,
          notes: cleanNullableString(notes),
          isActive: true,
        },
        create: {
          keyword: normalizedKeyword,
          targetUrl: cleanNullableString(targetUrl),
          locale,
          market: normalizedMarket,
          device,
          priority,
          notes: cleanNullableString(notes),
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(row, null, 2) }] };
    },
  );

  server.tool(
    "list_seo_keywords",
    "List SEO keywords being tracked, including their latest ranking snapshot",
    {
      includeInactive: z.boolean().optional().describe("Include inactive keywords"),
    },
    async ({ includeInactive = false }) => {
      const keywords = await prisma.seoKeyword.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: [{ isActive: "desc" }, { keyword: "asc" }],
        include: {
          rankSnapshots: {
            orderBy: { checkedAt: "desc" },
            take: 1,
          },
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ total: keywords.length, keywords }, null, 2) }] };
    },
  );

  server.tool(
    "record_seo_ranking",
    "Record a search ranking snapshot for a tracked keyword after checking Google or another SERP source",
    {
      keyword: z.string().describe("Keyword phrase that was checked"),
      position: z.number().int().positive().nullable().optional().describe("Ranking position, or null if not found"),
      url: z.string().nullable().optional().describe("Ranking URL found in search results"),
      targetUrl: z.string().nullable().optional().describe("Target URL/path for this keyword"),
      searchEngine: z.string().optional().describe("Search engine, e.g. google"),
      locale: z.string().optional().describe("Language/locale note, e.g. en-US or es-MX"),
      market: z.string().nullable().optional().describe("Search market/location used for the search"),
      device: z.enum(["desktop", "mobile"]).optional().describe("Device type"),
      checkedAt: z.string().optional().describe("ISO timestamp when ranking was checked"),
      resultTitle: z.string().nullable().optional().describe("SERP result title"),
      resultSnippet: z.string().nullable().optional().describe("SERP result snippet"),
      notes: z.string().nullable().optional().describe("Notes about this check"),
    },
    async ({ keyword, position, url, targetUrl, searchEngine = "google", locale = "en-US", market, device = "desktop", checkedAt, resultTitle, resultSnippet, notes }) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const normalizedMarket = cleanNullableString(market) || locale;
      if (!normalizedKeyword) {
        return { content: [{ type: "text" as const, text: "Error: keyword is required" }], isError: true };
      }
      const trackedKeyword = await prisma.seoKeyword.upsert({
        where: {
          keyword_locale_market_device: {
            keyword: normalizedKeyword,
            locale,
            market: normalizedMarket,
            device,
          },
        },
        update: {
          targetUrl: cleanNullableString(targetUrl),
          market: normalizedMarket,
          isActive: true,
        },
        create: {
          keyword: normalizedKeyword,
          targetUrl: cleanNullableString(targetUrl),
          locale,
          market: normalizedMarket,
          device,
        },
      });
      const snapshot = await prisma.seoRankSnapshot.create({
        data: {
          keywordId: trackedKeyword.id,
          searchEngine,
          device,
          location: normalizedMarket,
          rank: position ?? null,
          url: cleanNullableString(url),
          checkedAt: checkedAt ? new Date(checkedAt) : new Date(),
          title: cleanNullableString(resultTitle),
          notes: cleanNullableString(notes),
          metadata: resultSnippet ? { snippet: resultSnippet } : undefined,
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ keyword: trackedKeyword, snapshot }, null, 2) }] };
    },
  );

  server.tool(
    "get_seo_ranking_report",
    "Summarize tracked keyword rankings, trends, winners, losers, and keywords needing attention",
    {
      days: z.number().int().positive().max(365).optional().describe("Lookback window in days"),
    },
    async ({ days = 30 }) => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const keywords = await prisma.seoKeyword.findMany({
        where: { isActive: true },
        include: {
          rankSnapshots: {
            where: { checkedAt: { gte: since } },
            orderBy: { checkedAt: "desc" },
          },
        },
        orderBy: { keyword: "asc" },
      });
      const report = keywords.map((keyword) => {
        const latest = keyword.rankSnapshots[0] || null;
        const oldest = keyword.rankSnapshots[keyword.rankSnapshots.length - 1] || null;
        const latestRank = latest?.rank ?? null;
        const previousRank = oldest?.rank ?? null;
        const movement =
          latestRank && previousRank
            ? previousRank - latestRank
            : null;
        const status =
          latestRank === null
            ? "not_found"
            : latestRank <= 3
              ? "top_3"
              : latestRank <= 10
                ? "page_1"
                : latestRank <= 20
                  ? "page_2"
                  : "needs_attention";
        return {
          id: keyword.id,
          keyword: keyword.keyword,
          targetUrl: keyword.targetUrl,
          locale: keyword.locale,
          device: keyword.device,
          latestRank,
          previousRank,
          movement,
          status,
          latestUrl: latest?.url ?? null,
          rankSnapshots: keyword.rankSnapshots.length,
        };
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ days, totalKeywords: report.length, report }, null, 2) }] };
    },
  );

  server.tool(
    "generate_seo_recommendations",
    "Generate on-site SEO recommendations from current site settings, listings, tracked rankings, and target keywords",
    {
      focusKeywords: z.array(z.string()).optional().describe("Optional keywords to focus the recommendations on"),
    },
    async ({ focusKeywords = [] }) => {
      const rows = await prisma.siteContent.findMany();
      const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
      for (const row of rows) content[row.key] = row.value;
      const listings = await prisma.listing.findMany({
        where: { status: { not: "draft" } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: { id: true, title: true, slug: true, city: true, state: true, description: true, priceCurrency: true, imageUrl: true },
      });
      const tracked = await prisma.seoKeyword.findMany({
        where: { isActive: true },
        include: { rankSnapshots: { orderBy: { checkedAt: "desc" }, take: 1 } },
        orderBy: { keyword: "asc" },
      });
      const keywords = focusKeywords.length > 0 ? focusKeywords : tracked.map((item) => item.keyword);
      const recommendations: string[] = [];
      if (!content.seo_site_url) recommendations.push("Set seo_site_url so canonical URLs, sitemap, and sharing metadata are consistent.");
      if (!content.seo_home_description || content.seo_home_description.length < 120) recommendations.push("Expand the homepage SEO description to 120-160 characters with target market/location terms.");
      if (!content.seo_og_image) recommendations.push("Add a branded Open Graph image for better social sharing previews.");
      if (keywords.length === 0) recommendations.push("Add target keywords with add_seo_keyword, then record search positions with record_seo_ranking.");
      for (const keyword of keywords.slice(0, 10)) {
        const lower = keyword.toLowerCase();
        const appearsInHome = `${content.seo_home_title} ${content.seo_home_description} ${content.hero_title} ${content.hero_description}`.toLowerCase().includes(lower);
        if (!appearsInHome) recommendations.push(`Work "${keyword}" naturally into the homepage title, hero copy, or meta description if it is a priority keyword.`);
      }
      const thinListings = listings.filter((listing) => !listing.description || listing.description.replace(/<[^>]+>/g, "").length < 300);
      if (thinListings.length > 0) recommendations.push(`Add richer listing descriptions to ${thinListings.length} published listing(s), especially: ${thinListings.slice(0, 5).map((listing) => listing.title).join(", ")}.`);
      const missingImages = listings.filter((listing) => !listing.imageUrl);
      if (missingImages.length > 0) recommendations.push(`Add primary images to ${missingImages.length} listing(s) to improve listing UX and sharing previews.`);
      const rankingAttention = tracked.filter((item) => {
        const latest = item.rankSnapshots[0];
        return !latest || !latest.rank || latest.rank > 10;
      });
      if (rankingAttention.length > 0) recommendations.push(`Prioritize content/internal-link improvements for keywords not on page 1: ${rankingAttention.slice(0, 8).map((item) => item.keyword).join(", ")}.`);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            focusKeywords: keywords,
            trackedKeywords: tracked.length,
            publishedListingsReviewed: listings.length,
            recommendations,
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    "list_google_search_console_sites",
    "List Google Search Console properties available to the configured service account",
    async () => {
      try {
        const sites = await listSearchConsoleSites();
        return { content: [{ type: "text" as const, text: JSON.stringify({ total: sites.length, sites }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error listing Search Console sites: ${error instanceof Error ? error.message : "unknown error"}` }], isError: true };
      }
    },
  );

  server.tool(
    "query_google_search_console",
    "Query Google Search Console performance data for verified site queries/pages",
    {
      siteUrl: z.string().optional().describe("Search Console property URL. Defaults to GOOGLE_SEARCH_CONSOLE_SITE_URL."),
      startDate: z.string().optional().describe("YYYY-MM-DD start date. Defaults to 28 days ago."),
      endDate: z.string().optional().describe("YYYY-MM-DD end date. Defaults to yesterday."),
      dimensions: z.array(z.enum(["query", "page", "country", "device", "date"])).optional().describe("Search Console dimensions."),
      queryContains: z.string().optional().describe("Optional query filter."),
      pageContains: z.string().optional().describe("Optional page URL filter."),
      rowLimit: z.number().int().positive().max(25000).optional().describe("Max rows to return."),
    },
    async ({ siteUrl, startDate, endDate, dimensions, queryContains, pageContains, rowLimit = 100 }) => {
      try {
        const result = await querySearchConsole({
          siteUrl,
          startDate: startDate || dateDaysAgo(28),
          endDate: endDate || dateDaysAgo(1),
          dimensions,
          queryContains,
          pageContains,
          rowLimit,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error querying Search Console: ${error instanceof Error ? error.message : "unknown error"}` }], isError: true };
      }
    },
  );

  server.tool(
    "sync_google_search_console_rankings",
    "Fetch Search Console query/page performance and store average positions as SEO ranking snapshots",
    {
      siteUrl: z.string().optional().describe("Search Console property URL. Defaults to GOOGLE_SEARCH_CONSOLE_SITE_URL."),
      startDate: z.string().optional().describe("YYYY-MM-DD start date. Defaults to 28 days ago."),
      endDate: z.string().optional().describe("YYYY-MM-DD end date. Defaults to yesterday."),
      queryContains: z.string().optional().describe("Optional query filter."),
      pageContains: z.string().optional().describe("Optional page URL filter."),
      rowLimit: z.number().int().positive().max(25000).optional().describe("Max Search Console rows to sync."),
      locale: z.string().optional().describe("Locale note to store on tracked keywords."),
      market: z.string().nullable().optional().describe("Market/location label to store on tracked keywords."),
    },
    async ({ siteUrl, startDate, endDate, queryContains, pageContains, rowLimit = 100, locale = "en-US", market }) => {
      try {
        const normalizedMarket = cleanNullableString(market) || locale;
        const result = await querySearchConsole({
          siteUrl,
          startDate: startDate || dateDaysAgo(28),
          endDate: endDate || dateDaysAgo(1),
          dimensions: ["query", "page"],
          queryContains,
          pageContains,
          rowLimit,
        });
        let stored = 0;
        for (const row of result.rows) {
          const query = row.keys?.[0]?.trim().toLowerCase();
          const page = row.keys?.[1] || null;
          if (!query) continue;
          const keyword = await prisma.seoKeyword.upsert({
            where: {
              keyword_locale_market_device: {
                keyword: query,
                locale,
                market: normalizedMarket,
                device: "search_console",
              },
            },
            update: {
              targetUrl: page,
              market: normalizedMarket,
              isActive: true,
            },
            create: {
              keyword: query,
              locale,
              market: normalizedMarket,
              device: "search_console",
              targetUrl: page,
            },
          });
          await prisma.seoRankSnapshot.create({
            data: {
              keywordId: keyword.id,
              searchEngine: "google_search_console",
              device: "search_console",
              location: normalizedMarket,
              rank: row.position ? Math.round(row.position) : null,
              url: page,
              checkedAt: new Date(),
              metadata: {
                clicks: row.clicks || 0,
                impressions: row.impressions || 0,
                ctr: row.ctr || 0,
                averagePosition: row.position || null,
                startDate: startDate || dateDaysAgo(28),
                endDate: endDate || dateDaysAgo(1),
                siteUrl: result.siteUrl,
              },
            },
          });
          stored += 1;
        }
        return { content: [{ type: "text" as const, text: JSON.stringify({ siteUrl: result.siteUrl, fetched: result.rows.length, stored }, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error syncing Search Console rankings: ${error instanceof Error ? error.message : "unknown error"}` }], isError: true };
      }
    },
  );

  // -------------------------------------------------------------------------
  // Inquiries
  // -------------------------------------------------------------------------

  server.tool("list_inquiries", "List contact form inquiries, optionally filtered by status", { status: z.enum(["new", "read", "replied", "archived", "all"]).optional().describe("Filter by status") }, async ({ status }) => {
    const where = status && status !== "all" ? { status } : undefined;
    const submissions = await prisma.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
    const result = submissions.map((s) => ({ id: s.id, name: s.name, email: s.email, eventType: s.eventType, eventDate: s.eventDate, message: s.message, status: s.status, response: s.response, respondedAt: s.respondedAt ? fmt(s.respondedAt) : null, createdAt: fmt(s.createdAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify({ total: result.length, filter: status || "all", inquiries: result }, null, 2) }] };
  });

  server.tool("get_inquiry", "Get full details of a specific inquiry", { inquiryId: z.string().describe("The inquiry ID") }, async ({ inquiryId }) => {
    const sub = await prisma.contactSubmission.findUnique({ where: { id: inquiryId } });
    if (!sub) return { content: [{ type: "text" as const, text: "Error: Inquiry not found" }], isError: true };
    return { content: [{ type: "text" as const, text: JSON.stringify(sub, null, 2) }] };
  });

  server.tool("update_inquiry", "Update an inquiry's status or add a response. Setting a response auto-sets status to 'replied'", { inquiryId: z.string().describe("The inquiry ID"), status: z.enum(["new", "read", "replied", "archived"]).optional().describe("New status"), response: z.string().nullable().optional().describe("Response text or null to clear") }, async ({ inquiryId, status, response }) => {
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (response !== undefined) { updateData.response = response; updateData.respondedAt = response ? new Date() : null; if (response && !status) updateData.status = "replied"; }
    try { const sub = await prisma.contactSubmission.update({ where: { id: inquiryId }, data: updateData }); return { content: [{ type: "text" as const, text: JSON.stringify(sub, null, 2) }] }; } catch { return { content: [{ type: "text" as const, text: "Error: Inquiry not found or update failed" }], isError: true }; }
  });

  server.tool("delete_inquiry", "Permanently delete a contact form inquiry", { inquiryId: z.string().describe("The inquiry ID") }, async ({ inquiryId }) => {
    try {
      const sub = await prisma.contactSubmission.findUnique({ where: { id: inquiryId } });
      if (!sub) return { content: [{ type: "text" as const, text: "Error: Inquiry not found" }], isError: true };
      await prisma.contactSubmission.delete({ where: { id: inquiryId } });
      return { content: [{ type: "text" as const, text: `Deleted inquiry from "${sub.name}" (${sub.email}).` }] };
    } catch { return { content: [{ type: "text" as const, text: "Error: Failed to delete inquiry" }], isError: true }; }
  });

  // -------------------------------------------------------------------------
  // Correspondents (real-estate contact aliases over inquiry records)
  // -------------------------------------------------------------------------

  server.tool(
    "list_correspondents",
    "List correspondents from contact form records, optionally filtered by status",
    { status: z.enum(["new", "read", "replied", "archived", "all"]).optional().describe("Filter by status") },
    async ({ status }) => {
      const where = status && status !== "all" ? { status } : undefined;
      const correspondents = await prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ total: correspondents.length, filter: status || "all", correspondents }, null, 2),
        }],
      };
    },
  );

  server.tool(
    "get_correspondent",
    "Get a correspondent/contact record by ID",
    { correspondentId: z.string().describe("The correspondent/contact ID") },
    async ({ correspondentId }) => {
      const correspondent = await prisma.contactSubmission.findUnique({ where: { id: correspondentId } });
      if (!correspondent) return { content: [{ type: "text" as const, text: "Error: Correspondent not found" }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(correspondent, null, 2) }] };
    },
  );

  server.tool(
    "create_correspondent",
    "Create a correspondent/contact record for a buyer, seller, investor, or vendor",
    {
      name: z.string().describe("Correspondent name"),
      email: z.string().describe("Correspondent email"),
      realEstateGoal: z.string().optional().describe("Buying, selling, relocating, investing, vendor, etc."),
      timeline: z.string().optional().describe("Ideal timeline or follow-up timing"),
      message: z.string().describe("Notes, message, or correspondence summary"),
      status: z.enum(["new", "read", "replied", "archived"]).optional().describe("Correspondent status"),
    },
    async ({ name, email, realEstateGoal, timeline, message, status }) => {
      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedMessage = message.trim();
      if (!trimmedName || !normalizedEmail || !trimmedMessage) {
        return { content: [{ type: "text" as const, text: "Error: name, email, and message are required" }], isError: true };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { content: [{ type: "text" as const, text: "Error: Invalid email format" }], isError: true };
      }
      const correspondent = await prisma.contactSubmission.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          eventType: cleanNullableString(realEstateGoal),
          eventDate: cleanNullableString(timeline),
          message: trimmedMessage,
          status: status ?? "new",
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(correspondent, null, 2) }] };
    },
  );

  server.tool(
    "update_correspondent",
    "Update a correspondent/contact record",
    {
      correspondentId: z.string().describe("The correspondent/contact ID"),
      name: z.string().optional().describe("Updated name"),
      email: z.string().optional().describe("Updated email"),
      realEstateGoal: z.string().nullable().optional().describe("Updated real estate goal"),
      timeline: z.string().nullable().optional().describe("Updated timeline"),
      message: z.string().optional().describe("Updated message or notes"),
      status: z.enum(["new", "read", "replied", "archived"]).optional().describe("Updated status"),
      response: z.string().nullable().optional().describe("Response notes; setting a value marks as replied unless status is provided"),
    },
    async ({ correspondentId, name, email, realEstateGoal, timeline, message, status, response }) => {
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) { const value = name.trim(); if (!value) return { content: [{ type: "text" as const, text: "Error: name cannot be empty" }], isError: true }; updateData.name = value; }
      if (email !== undefined) {
        const value = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { content: [{ type: "text" as const, text: "Error: Invalid email format" }], isError: true };
        updateData.email = value;
      }
      if (realEstateGoal !== undefined) updateData.eventType = cleanNullableString(realEstateGoal);
      if (timeline !== undefined) updateData.eventDate = cleanNullableString(timeline);
      if (message !== undefined) { const value = message.trim(); if (!value) return { content: [{ type: "text" as const, text: "Error: message cannot be empty" }], isError: true }; updateData.message = value; }
      if (status !== undefined) updateData.status = status;
      if (response !== undefined) {
        updateData.response = response;
        updateData.respondedAt = response ? new Date() : null;
        if (response && status === undefined) updateData.status = "replied";
      }
      try {
        const correspondent = await prisma.contactSubmission.update({ where: { id: correspondentId }, data: updateData });
        return { content: [{ type: "text" as const, text: JSON.stringify(correspondent, null, 2) }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Correspondent not found or update failed" }], isError: true };
      }
    },
  );

  server.tool(
    "delete_correspondent",
    "Delete a correspondent/contact record",
    { correspondentId: z.string().describe("The correspondent/contact ID") },
    async ({ correspondentId }) => {
      try {
        const correspondent = await prisma.contactSubmission.findUnique({ where: { id: correspondentId } });
        if (!correspondent) return { content: [{ type: "text" as const, text: "Error: Correspondent not found" }], isError: true };
        await prisma.contactSubmission.delete({ where: { id: correspondentId } });
        return { content: [{ type: "text" as const, text: `Deleted correspondent "${correspondent.name}" (${correspondent.email}).` }] };
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Failed to delete correspondent" }], isError: true };
      }
    },
  );

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  server.tool("search_clients", "Search for clients by name or email", { query: z.string().describe("Search term") }, async ({ query }) => {
    const clients = await prisma.client.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, slug: true, isActive: true, createdAt: true, _count: { select: { photos: true } } } });
    const result = clients.map((c) => ({ id: c.id, name: c.name, email: c.email, slug: c.slug, isActive: c.isActive, photoCount: c._count.photos, createdAt: fmt(c.createdAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify({ total: result.length, clients: result }, null, 2) }] };
  });

  server.tool("search_inquiries", "Search inquiries by name, email, or message content", { query: z.string().describe("Search term") }, async ({ query }) => {
    const subs = await prisma.contactSubmission.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }, { message: { contains: query, mode: "insensitive" } }] }, orderBy: { createdAt: "desc" } });
    const result = subs.map((s) => ({ id: s.id, name: s.name, email: s.email, eventType: s.eventType, status: s.status, message: s.message.substring(0, 200) + (s.message.length > 200 ? "..." : ""), createdAt: fmt(s.createdAt) }));
    return { content: [{ type: "text" as const, text: JSON.stringify({ total: result.length, inquiries: result }, null, 2) }] };
  });

  // -------------------------------------------------------------------------
  // Admin Account
  // -------------------------------------------------------------------------

  server.tool("get_admin_account", "Get the current admin account information", async () => {
    const admin = await prisma.user.findFirst({ select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } });
    if (!admin) return { content: [{ type: "text" as const, text: "Error: No admin account found" }], isError: true };
    return { content: [{ type: "text" as const, text: JSON.stringify(admin, null, 2) }] };
  });

  server.tool("update_admin_account", "Update the admin account name, email, or password", { name: z.string().optional().describe("New name"), email: z.string().optional().describe("New email"), password: z.string().optional().describe("New password") }, async ({ name, email, password }) => {
    const admin = await prisma.user.findFirst();
    if (!admin) return { content: [{ type: "text" as const, text: "Error: No admin account found" }], isError: true };
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) { const t = name.trim(); if (!t) return { content: [{ type: "text" as const, text: "Error: Name cannot be empty" }], isError: true }; updateData.name = t; }
    if (email !== undefined) { const n = email.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return { content: [{ type: "text" as const, text: "Error: Invalid email" }], isError: true }; updateData.email = n; }
    if (password !== undefined) updateData.password = await bcrypt.hash(password, 12);
    const updated = await prisma.user.update({ where: { id: admin.id }, data: updateData, select: { id: true, name: true, email: true, updatedAt: true } });
    return { content: [{ type: "text" as const, text: JSON.stringify(updated, null, 2) }] };
  });
}
