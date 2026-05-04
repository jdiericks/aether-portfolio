import { prisma } from "@/lib/prisma";
import { isUnavailablePrismaReadError } from "@/lib/prisma-errors";

export interface LocationPage {
  name: string;
  slug: string;
  title: string;
  description: string;
  count?: number;
  updatedAt?: Date;
  region?: string | null;
  listings?: Array<{
    title: string;
    slug: string;
    address: string;
    price: string;
    priceCurrency: string;
    status: string;
  }>;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function locationSlug(value: string | null | undefined) {
  const slug = slugify(value || "");
  return slug || "baja-california";
}

export const fallbackLocations: LocationPage[] = [
  {
    name: "Ensenada",
    slug: "ensenada",
    title: "Ensenada Real Estate",
    description:
      "Explore homes, investment properties, and land opportunities in Ensenada, Baja California.",
  },
  {
    name: "Valle de Guadalupe",
    slug: "valle-de-guadalupe",
    title: "Valle de Guadalupe Real Estate",
    description:
      "Discover vineyard, land, hospitality, and lifestyle real estate opportunities in Valle de Guadalupe.",
  },
  {
    name: "Baja California",
    slug: "baja-california",
    title: "Baja California Real Estate",
    description:
      "Research real estate opportunities across Baja California with local advisory support.",
  },
];

export const locationSeeds = fallbackLocations;

export function locationTitle(value: string | { neighborhood?: string | null; city?: string | null; municipality?: string | null; state?: string | null } | null | undefined) {
  const name =
    typeof value === "string"
      ? value.trim()
      : value
        ? (value.neighborhood || value.city || value.municipality || value.state || "").trim()
        : "";
  return name ? `${name} Real Estate` : "Baja California Real Estate";
}

export function locationDisplayName(location: LocationPage) {
  return location.name;
}

export async function getLocationPages(): Promise<LocationPage[]> {
  if (!process.env.DATABASE_URL) return fallbackLocations;

  try {
    const rows = await prisma.listing.findMany({
      where: { status: { not: "draft" } },
      select: {
        title: true,
        slug: true,
        address: true,
        city: true,
        municipality: true,
        state: true,
        neighborhood: true,
        price: true,
        priceCurrency: true,
        status: true,
        updatedAt: true,
      },
    });
    const grouped = new Map<string, LocationPage>();
    for (const row of rows) {
      [row.neighborhood, row.city, row.municipality, row.state]
        .filter((value): value is string => Boolean(value?.trim()))
        .forEach((value) => {
          const name = value.trim();
          const slug = locationSlug(name);
          const existing = grouped.get(slug) || {
            name,
            slug,
            title: `${name} Real Estate`,
            description: `Explore real estate listings, market context, and investment opportunities in ${name}.`,
            count: 0,
            updatedAt: row.updatedAt,
            region: row.state,
            listings: [],
          };
          existing.count = (existing.count || 0) + 1;
          existing.updatedAt =
            existing.updatedAt && existing.updatedAt > row.updatedAt
              ? existing.updatedAt
              : row.updatedAt;
          existing.listings?.push({
            title: row.title,
            slug: row.slug,
            address: row.address,
            price: row.price,
            priceCurrency: row.priceCurrency,
            status: row.status,
          });
          grouped.set(slug, existing);
        });
    }

    const bySlug = new Map<string, LocationPage>();
    fallbackLocations.forEach((location) => {
      bySlug.set(location.slug, { ...location, count: 0, listings: [] });
    });
    grouped.forEach((location) => {
      bySlug.set(location.slug, location);
    });
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (isUnavailablePrismaReadError(error)) return fallbackLocations;
    throw error;
  }
}

export async function getLocationSummaries() {
  return getLocationPages();
}

