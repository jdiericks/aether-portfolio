import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { JsonLd } from "@/components/schema-json-ld";
import { getContentPosts } from "@/lib/content-hub";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Real Estate Insights",
    description:
      "Guides and market notes for Baja California buyers, sellers, and land investors.",
  };
}

export default async function InsightsHubPage() {
  const content = await getSiteContent();
  const posts = await getContentPosts();
  const baseUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");

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
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Real Estate Insights
        </p>
        <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
          Baja California buyer, seller, and land-investment guides
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Practical notes for understanding land, homes, neighborhoods, and
          cross-border real estate decisions.
        </p>

        {posts.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed p-10 text-muted-foreground">
            No insights have been published yet. Add posts in Admin &gt; Content.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.slug} className="rounded-2xl border p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {post.category || "Insight"}
                </p>
                <h2 className="mt-3 text-xl font-medium">
                  <Link href={`/insights/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{post.excerpt || post.description}</p>
              </article>
            ))}
          </div>
        )}
      </main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Real Estate Insights",
          url: `${baseUrl}/insights`,
          blogPost: posts.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            url: `${baseUrl}/insights/${post.slug}`,
            description: post.excerpt || post.description,
            datePublished: post.publishedAt?.toISOString(),
          })),
        }}
      />
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
