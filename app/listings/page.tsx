import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prisma-errors";
import { getSiteContent } from "@/lib/site-content";
import { Footer, brandingFooterProps } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { ListingFilterGrid } from "@/components/listings/listing-filter-grid";

export const dynamic = "force-dynamic";

async function getListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: { not: "draft" } },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const title = content.seo_listings_title || "Listings";
  const description =
    content.seo_listings_description ||
    "Browse available homes, featured properties, and real estate opportunities.";
  const image = content.seo_og_image || "/og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
    twitter: {
      title,
      description,
      images: [image],
    },
  };
}

export default async function ListingsPage() {
  const [listings, content] = await Promise.all([getListings(), getSiteContent()]);

  return (
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
        <section className="border-b bg-muted/30 px-4 pb-16 pt-28 md:pb-24">
          <div className="container mx-auto max-w-5xl">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to home
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Available listings
            </p>
            <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
              Browse properties managed by {content.brand_name}{" "}
              {content.brand_subtitle}.
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Review active and recently updated listings. Each page includes key
              property details, pricing, and next-step contact options.
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
          <ListingFilterGrid
            listings={listings}
            currencyRate={content.currency_usd_to_mxn_rate}
            currencySwitchEnabled={content.currency_switch_enabled !== "false"}
            currencyDefaultDisplay={content.currency_default_display}
          />
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
          content.social_whatsapp
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
  );
}
