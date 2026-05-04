import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContentPostBySlug, getContentPosts } from "@/lib/content-hub";
import { getSiteContent } from "@/lib/site-content";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { JsonLd } from "@/components/schema-json-ld";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getContentPostBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: article.title,
    description: article.description,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [content] = await Promise.all([getSiteContent()]);
  const article = await getContentPostBySlug(slug);
  if (!article) notFound();
  const baseUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");
  const brandName = content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();

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
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-3xl px-4 pb-16 pt-28">
        <Link href="/insights" className="text-sm text-muted-foreground hover:text-foreground">
          Back to insights
        </Link>
        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  {article.category || "Insight"}
        </p>
        <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{article.description}</p>
        <div className="mt-10 space-y-8">
          <div
            className="prose prose-neutral max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
        </div>
      </main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          url: `${baseUrl}/insights/${article.slug}`,
          dateModified: article.updatedAt.toISOString(),
          datePublished: article.publishedAt?.toISOString(),
          author: {
            "@type": "Person",
            name: content.agent_name || content.seo_site_name || content.brand_name,
            url: `${baseUrl}/agents/eric-becerra`,
          },
          publisher: {
            "@type": "Organization",
            name: brandName,
          },
          mainEntityOfPage: `${baseUrl}/insights/${article.slug}`,
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
        whatsappUrl={
          content.marketing_whatsapp_url ||
          content.social_whatsapp ||
          content.agent_whatsapp ||
          content.agent_whatsapp_url ||
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
  );
}

export async function generateStaticParams() {
  const articles = await getContentPosts({ includeDrafts: false });
  return articles.map((article) => ({ slug: article.slug }));
}
