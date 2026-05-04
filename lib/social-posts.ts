import type { Listing } from "@prisma/client";

export function normalizePlatform(platform: unknown) {
  if (typeof platform !== "string") return "facebook";
  const value = platform.trim().toLowerCase();
  return ["facebook", "instagram", "linkedin", "tiktok", "x", "manual"].includes(value)
    ? value
    : "facebook";
}

export function listingAddress(listing: Pick<Listing, "address" | "city" | "state">) {
  return [listing.address, listing.city, listing.state].filter(Boolean).join(", ");
}

export function listingUrl(listing: Pick<Listing, "slug">, siteUrl?: string) {
  const baseUrl = (siteUrl || "https://diericksrealty.com").replace(/\/$/, "");
  return `${baseUrl}/listings/${listing.slug}`;
}

export function listingHashtags(listing: Pick<Listing, "city" | "state">) {
  const localTags = [listing.city, listing.state]
    .filter(Boolean)
    .map((value) => `#${String(value).replace(/[^a-zA-Z0-9]/g, "")}`);

  return [
    "#RealEstate",
    "#PropertyForSale",
    "#HomeBuying",
    ...localTags,
  ];
}

export function listingMediaUrls(
  listing: Pick<Listing, "imageUrl" | "videoUrl" | "gallery">
) {
  const urls = [listing.imageUrl, listing.videoUrl].filter(Boolean) as string[];
  if (Array.isArray(listing.gallery)) {
    for (const item of listing.gallery) {
      if (!item || typeof item !== "object") continue;
      const media = item as { url?: unknown };
      if (typeof media.url === "string" && media.url.trim()) {
        urls.push(media.url);
      }
    }
  }
  return [...new Set(urls)];
}

export function createListingCaption(
  listing: Pick<
    Listing,
    | "title"
    | "slug"
    | "address"
    | "city"
    | "state"
    | "price"
    | "priceCurrency"
    | "beds"
    | "baths"
    | "squareFeet"
    | "description"
  >,
  options: { tone?: string; callToAction?: string; siteUrl?: string } = {}
) {
  const tone = options.tone || "warm and polished";
  const callToAction = options.callToAction || "Message us to schedule a private showing.";
  const specs = [
    listing.beds ? `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` : null,
    listing.baths ? `${listing.baths} bath${listing.baths === 1 ? "" : "s"}` : null,
    listing.squareFeet ? `${listing.squareFeet.toLocaleString()} sq ft` : null,
  ].filter(Boolean);

  const plainDescription = (listing.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return [
    `${listing.title}`,
    "",
    `${listing.priceCurrency || "USD"} ${listing.price}`,
    specs.length > 0 ? specs.join(" / ") : null,
    listingAddress(listing),
    "",
    plainDescription
      ? `${plainDescription.slice(0, 220)}${plainDescription.length > 220 ? "..." : ""}`
      : `A ${tone} property opportunity ready for your next move.`,
    "",
    callToAction,
    listingUrl(listing, options.siteUrl),
  ]
    .filter(Boolean)
    .join("\n");
}

export function generateListingSocialPost(
  listing: Listing,
  platform: string = "facebook",
  options: { tone?: string; callToAction?: string; siteUrl?: string } = {}
) {
  const normalizedPlatform = normalizePlatform(platform);
  const hashtags = listingHashtags(listing);
  const platformTags =
    normalizedPlatform === "instagram"
      ? ["#InstagramReels", "#HouseHunting"]
      : normalizedPlatform === "facebook"
        ? ["#FacebookMarketplace", "#OpenHouse"]
        : [];

  return {
    platform: normalizedPlatform,
    caption: createListingCaption(listing, options),
    hashtags: [...new Set([...hashtags, ...platformTags])],
    mediaUrls: listingMediaUrls(listing),
  };
}
