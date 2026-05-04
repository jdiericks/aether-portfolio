import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prisma-errors";
import { getSiteContent } from "@/lib/site-content";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getSiteContent();
  const siteName = `${content.brand_name} ${content.brand_subtitle}`.trim();

  return {
    title: `Sitemap | ${siteName}`,
    description: `Browse public pages and property listings for ${siteName}.`,
  };
}

async function getListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: { not: "draft" } },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      select: {
        title: true,
        slug: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export default async function SiteMapPage() {
  const [content, listings] = await Promise.all([getSiteContent(), getListings()]);
  const staticLinks = [
    { href: "/", label: "Home" },
    { href: "/listings", label: "Listings" },
    { href: "/locations", label: "Locations" },
    { href: "/insights", label: "Real Estate Insights" },
    { href: "/agents/eric-becerra", label: "Eric Becerra" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/login", label: "Client Login" },
  ];

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
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 pb-16 pt-28">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Sitemap
          </p>
          <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
            Find your way around {content.brand_name} {content.brand_subtitle}
          </h1>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="text-xl font-medium">Site pages</h2>
            <ul className="mt-4 space-y-3">
              {staticLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium">Property listings</h2>
            {listings.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                No public listings are currently available.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {listings.map((listing) => (
                  <li key={listing.slug}>
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="text-primary hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(listing.updatedAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer
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
