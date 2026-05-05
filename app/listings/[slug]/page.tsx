import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Bath, Bed, Facebook, Home, Instagram, Mail, MapPin, MessageCircle, Phone, Ruler } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prisma-errors";
import { getSiteContent } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Footer, brandingFooterProps } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { ListingInquiryForm } from "@/components/listing-inquiry-form";
import { ListingMediaGallery } from "@/components/listing-media-gallery";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { parseListingPriceAmount } from "@/lib/listing-currency";
import { serializeJsonLd } from "@/lib/json-ld";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { TrackingProvider } from "@/components/tracking-provider";
import { locationSlug, locationTitle } from "@/lib/location-pages";

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatAddress(listing: {
  address: string;
  city: string | null;
  state: string | null;
  postalCode?: string | null;
  country?: string | null;
}) {
  return [listing.address, listing.city, listing.state, listing.postalCode, listing.country]
    .filter(Boolean)
    .join(", ");
}

function parsePriceAmount(price: string) {
  const number = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

interface GalleryItem {
  url: string;
  type?: "image" | "video";
  alt?: string;
}

function getGalleryItems(listing: {
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  gallery: unknown;
}) {
  const items: GalleryItem[] = [];

  if (listing.imageUrl) {
    items.push({ url: listing.imageUrl, type: "image", alt: `${listing.title} photo` });
  }

  if (listing.videoUrl) {
    items.push({ url: listing.videoUrl, type: "video", alt: `${listing.title} video` });
  }

  if (Array.isArray(listing.gallery)) {
    for (const item of listing.gallery) {
      if (!item || typeof item !== "object") continue;
      const media = item as { url?: unknown; type?: unknown; alt?: unknown };
      if (typeof media.url !== "string" || !media.url.trim()) continue;
      items.push({
        url: media.url,
        type: media.type === "video" ? "video" : "image",
        alt: typeof media.alt === "string" ? media.alt : `${listing.title} media`,
      });
    }
  }

  return items;
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  let listing;
  try {
    listing = await prisma.listing.findUnique({
      where: { slug },
      select: {
        title: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        price: true,
        priceAmount: true,
        priceCurrency: true,
        description: true,
        imageUrl: true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        title: "Listing Not Found",
      };
    }
    throw error;
  }

  if (!listing) {
    return {
      title: "Listing Not Found",
    };
  }

  const address = formatAddress(listing);
  const priceAmount = parseListingPriceAmount(
    listing.price,
    listing.priceAmount
  );

  return {
    title: `${listing.title} | ${address}`,
    description:
      listing.description ||
      `View details for ${listing.title}, a real estate listing at ${address}.`,
    openGraph: {
      title: listing.title,
      description: listing.description || address,
      images: listing.imageUrl ? [listing.imageUrl] : undefined,
    },
    other: {
      ...(priceAmount ? { "product:price:amount": String(priceAmount) } : {}),
      "product:price:currency": listing.priceCurrency || "USD",
    },
  };
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const { slug } = await params;
  const content = await getSiteContent();
  let listing;
  try {
    listing = await prisma.listing.findUnique({
      where: { slug },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      notFound();
    }
    throw error;
  }

  if (!listing || listing.status === "draft") {
    notFound();
  }

  const address = formatAddress(listing);
  const location = locationTitle(listing);
  const locationHref = location ? `/locations/${locationSlug(location)}` : null;
  const hasCoordinates =
    typeof listing.latitude === "number" && typeof listing.longitude === "number";
  const whatsappUrl =
    content.marketing_whatsapp_url ||
    content.agent_whatsapp ||
    content.agent_whatsapp_url ||
    content.whatsapp_contact_url;
  const agentName = content.agent_name || content.brand_name;
  const agentTitle = content.agent_title || content.brand_subtitle;
  const agentEmail = content.agent_email || content.contact_email;
  const agentPhone = content.agent_phone || content.contact_phone;
  const agentPhotoUrl = content.agent_photo_url;
  const galleryItems = getGalleryItems(listing);
  const priceAmount = parseListingPriceAmount(listing.price, listing.priceAmount);
  const descriptionHtml = listing.description
    ? sanitizeRichHtml(listing.description)
    : "";
  const facts = [
    listing.beds !== null
      ? { icon: Bed, label: `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` }
      : null,
    listing.baths !== null
      ? {
          icon: Bath,
          label: `${listing.baths} bath${listing.baths === 1 ? "" : "s"}`,
        }
      : null,
    listing.squareFeet !== null
      ? { icon: Ruler, label: `${listing.squareFeet.toLocaleString()} sq ft` }
      : null,
    listing.lotSize ? { icon: Home, label: listing.lotSize } : null,
  ].filter(Boolean) as { icon: typeof Bed; label: string }[];

  return (
    <>
      <TrackingProvider
        context={{
          listingId: listing.id,
          listingSlug: listing.slug,
          listingTitle: listing.title,
        }}
      />
      <div className="min-h-screen bg-background">
      <Navbar
        brandName={content.brand_name}
        brandSubtitle={content.brand_subtitle}
        logoUrl={content.brand_logo_url}
        logoWidth={content.brand_logo_width}
        logoHeight={content.brand_logo_height}
        logoBackground={content.brand_logo_background}
        showBrandText={content.brand_header_show_text !== "false"}
        solid
      />
      <main id="main-content" tabIndex={-1}>
        <section className="container mx-auto px-4 pb-10">
        <ListingMediaGallery
          items={galleryItems}
          title={listing.title}
          overlayContent={
            <div className="mx-auto flex min-h-[760px] w-full max-w-6xl flex-col justify-between px-4 pb-8 pt-[180px] md:min-h-[680px] md:pb-10 md:pt-[140px]">
              <Button asChild variant="secondary" className="w-fit bg-white/90 text-black hover:bg-white">
                <Link href="/listings">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to listings
                </Link>
              </Button>

              <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                <div>
                  <p className="mb-3 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/85 backdrop-blur">
                    {listing.status}
                  </p>
                  <h1 className="max-w-4xl text-4xl font-light tracking-tight text-white drop-shadow md:text-6xl">
                    {listing.title}
                  </h1>
                  <p className="mt-4 flex items-center gap-2 text-white/85">
                    <MapPin className="h-4 w-4" />
                    {address}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/20 bg-white/92 p-6 text-black shadow-2xl backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/60">
                    Asking price
                  </p>
                  <CurrencySwitcher
                    amount={priceAmount}
                    currency={listing.priceCurrency}
                    rate={content.currency_usd_to_mxn_rate}
                    enabled={content.currency_switch_enabled !== "false"}
                    defaultCurrency={content.currency_default_display}
                    className="mt-2"
                    valueClassName="text-3xl text-black"
                  />
                  <div className="mt-6 grid gap-2">
                    <Button asChild>
                      <a href="#listing-inquiry">Request a showing</a>
                    </Button>
                    {whatsappUrl && (
                      <Button asChild variant="outline">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <ListingJsonLd listing={listing} address={address} siteUrl={content.seo_site_url} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.8fr_0.4fr]">
          <article>
            <h2 className="text-2xl font-light">Property overview</h2>
            {descriptionHtml ? (
              <div
                className="mt-4 space-y-4 text-lg leading-8 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:text-2xl [&_h2]:text-foreground [&_h3]:text-xl [&_h3]:text-foreground [&_li]:ml-6 [&_li]:list-disc [&_p]:leading-8 [&_strong]:text-foreground"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Contact the team for property details, disclosures, showing
                availability, and neighborhood guidance.
              </p>
            )}
          </article>

          <div className="space-y-6">
            <aside className="rounded-2xl border p-6">
              <h2 className="text-lg font-medium">Listing details</h2>
              <div className="mt-5 space-y-4">
                {facts.length > 0 ? (
                  facts.map((fact) => {
                    const Icon = fact.icon;
                    return (
                      <div key={fact.label} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>{fact.label}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Detailed specs available on request.
                  </p>
                )}
              </div>
              <div className="mt-6 border-t pt-5 text-sm text-muted-foreground">
                <p>{address}</p>
                {listing.neighborhood && <p>Neighborhood: {listing.neighborhood}</p>}
                {listing.municipality && <p>Municipality: {listing.municipality}</p>}
                {locationHref && (
                  <Link href={locationHref} className="mt-3 inline-flex text-primary hover:underline">
                    Explore more properties in {location}
                  </Link>
                )}
              </div>
            </aside>

            {hasCoordinates && (
              <aside className="overflow-hidden rounded-2xl border">
                <div className="p-6">
                  <h2 className="text-lg font-medium">Location</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Approximate property location.
                  </p>
                </div>
                <iframe
                  title={`${listing.title} map`}
                  src={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}&z=15&output=embed`}
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </aside>
            )}

            <aside className="rounded-2xl border p-6">
              <h2 className="text-lg font-medium">Listing agent</h2>
              <div className="mt-5 flex gap-4">
                {agentPhotoUrl && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                    <Image src={agentPhotoUrl} alt={agentName || "Listing agent"} fill className="object-cover" sizes="64px" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{agentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {agentTitle}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 text-sm">
                {agentPhone && (
                  <a className="flex items-center gap-2 hover:underline" href={`tel:${agentPhone}`}>
                    <Phone className="h-4 w-4" />
                    {agentPhone}
                  </a>
                )}
                {agentEmail && (
                  <a className="flex items-center gap-2 hover:underline" href={`mailto:${agentEmail}`}>
                    <Mail className="h-4 w-4" />
                    {agentEmail}
                  </a>
                )}
                {whatsappUrl && (
                  <a className="flex items-center gap-2 hover:underline" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>
              <div className="mt-5 flex gap-3">
                {listing.facebookUrl && (
                  <a href={listing.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {listing.instagramUrl && (
                  <a href={listing.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>

        <section id="listing-inquiry" className="mt-12 rounded-2xl border p-6">
          <h2 className="text-2xl font-light">Ask about this property</h2>
          <p className="mt-2 text-muted-foreground">
            Send a showing request or question and it will appear in the admin inquiry area.
          </p>
          <ListingInquiryForm
            listingTitle={listing.title}
            listingSlug={listing.slug}
            googleAdsConversionTarget={
              content.marketing_google_ads_id && content.marketing_google_ads_label
                ? `${content.marketing_google_ads_id}/${content.marketing_google_ads_label}`
                : undefined
            }
          />
        </section>
        </section>
      </main>
      <Footer
        {...brandingFooterProps(content)}
        brandName={content.brand_name}
        brandSubtitle={content.brand_subtitle}
        logoUrl={content.brand_logo_url}
        description={content.footer_description}
        location={content.footer_location}
        instagramUrl={content.social_instagram}
        facebookUrl={content.social_facebook}
        tiktokUrl={content.social_tiktok}
        youtubeUrl={content.social_youtube}
        linkedinUrl={content.social_linkedin}
        xUrl={content.social_x}
        whatsappUrl={
          content.marketing_whatsapp_url ||
          content.agent_whatsapp ||
          content.agent_whatsapp_url ||
          content.social_whatsapp ||
          content.whatsapp_contact_url
        }
        privacyUrl={content.footer_privacy_url}
        termsUrl={content.footer_terms_url}
        sitemapUrl={content.footer_sitemap_url}
        accessibilityUrl={content.footer_accessibility_url}
        copyrightText={content.footer_copyright}
        showPrivacyLink={content.footer_show_privacy_link !== "false"}
        showTermsLink={content.footer_show_terms_link !== "false"}
        showSitemapLink={content.footer_show_sitemap_link !== "false"}
        showAccessibilityLink={content.footer_show_accessibility_link !== "false"}
      />
      </div>
    </>
  );
}

function ListingJsonLd({
  listing,
  address,
  siteUrl,
}: {
  listing: {
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    price: string;
    priceAmount: number | null;
    priceCurrency: string | null;
    address: string;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    beds: number | null;
    baths: number | null;
    squareFeet: number | null;
  };
  address: string;
  siteUrl?: string;
}) {
  const baseUrl = (siteUrl || "https://diericksrealty.com").replace(/\/$/, "");
  const priceAmount =
    parseListingPriceAmount(listing.price, listing.priceAmount) ||
    parsePriceAmount(listing.price);
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description || `Property listing at ${address}`,
    url: `${baseUrl}/listings/${listing.slug}`,
    image: listing.imageUrl ? [listing.imageUrl] : undefined,
    offers: {
      "@type": "Offer",
      price: priceAmount,
      priceCurrency: listing.priceCurrency || "USD",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city || undefined,
      addressRegion: listing.state || undefined,
      postalCode: listing.postalCode || undefined,
      addressCountry: listing.country || "MX",
    },
    geo:
      listing.latitude !== null && listing.longitude !== null
        ? {
            "@type": "GeoCoordinates",
            latitude: listing.latitude,
            longitude: listing.longitude,
          }
        : undefined,
    numberOfBedrooms: listing.beds ?? undefined,
    numberOfBathroomsTotal: listing.baths ?? undefined,
    floorSize: listing.squareFeet
      ? {
          "@type": "QuantitativeValue",
          value: listing.squareFeet,
          unitCode: "FTK",
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
