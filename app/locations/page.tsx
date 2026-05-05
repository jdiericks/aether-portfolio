import Link from "next/link";
import type { Metadata } from "next";
import { Footer, brandingFooterProps } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { JsonLd } from "@/components/schema-json-ld";
import { getLocationSummaries, locationDisplayName } from "@/lib/location-pages";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: `Location guides | ${content.seo_site_name || content.brand_name}`,
    description:
      "Explore real estate location guides and active property listings by area.",
  };
}

export default async function LocationsPage() {
  const [content, locations] = await Promise.all([
    getSiteContent(),
    getLocationSummaries(),
  ]);
  const siteUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Real estate location guides",
          url: `${siteUrl}/locations`,
          description: "Real estate location guides with active listings by market area.",
          hasPart: locations.map((location) => ({
            "@type": "Place",
            name: locationDisplayName(location),
            url: `${siteUrl}/locations/${location.slug}`,
          })),
        }}
      />
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
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pb-16 pt-28">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Location guides
        </p>
        <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
          Browse properties by location
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Explore local market pages with active listings, neighborhood context, and
          buyer/seller guidance.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-muted-foreground">
              Location guides will appear once listings are published.
            </div>
          ) : (
            locations.map((location) => (
              <Link
                key={location.slug}
                href={`/locations/${location.slug}`}
                className="rounded-2xl border p-6 transition-colors hover:bg-muted/40"
              >
                <h2 className="text-xl font-medium">{locationDisplayName(location)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {location.count} active listing{location.count === 1 ? "" : "s"}
                </p>
                <p className="mt-4 text-sm font-medium text-primary">View location guide</p>
              </Link>
            ))
          )}
        </div>
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
        whatsappUrl={content.marketing_whatsapp_url || content.social_whatsapp}
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
