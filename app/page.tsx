import type { Metadata } from "next";
import { getSiteContent } from "@/lib/site-content";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/aether/problem-section";
import { SolutionSection } from "@/components/landing/aether/solution-section";
import { IncludedSection } from "@/components/landing/aether/included-section";
import { TechCredibilitySection } from "@/components/landing/aether/tech-credibility-section";
import { ProofSection } from "@/components/landing/aether/proof-section";
import { PricingSection } from "@/components/landing/aether/pricing-section";
import { AboutSection } from "@/components/landing/aether/about-section";
import { AuditSection } from "@/components/landing/aether/audit-section";
import { Footer, brandingFooterProps } from "@/components/landing/footer";
import { LatestPostSection } from "@/components/landing/latest-post-section";
import { Navbar } from "@/components/landing/navbar";
import { JsonLd } from "@/components/schema-json-ld";
import { getContentPosts } from "@/lib/content-hub";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content.seo_home_title,
    description: content.seo_home_description,
    keywords: content.seo_keywords,
    openGraph: {
      title: content.seo_home_title,
      description: content.seo_home_description,
      images: content.seo_og_image ? [content.seo_og_image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo_home_title,
      description: content.seo_home_description,
      images: content.seo_og_image ? [content.seo_og_image] : undefined,
    },
  };
}

function splitList(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function HomePage() {
  const [content, posts] = await Promise.all([
    getSiteContent(),
    getContentPosts(),
  ]);

  const aboutFeatures = [1, 2, 3, 4]
    .map((n) => ({
      icon: content[`about_feature_${n}_icon`] || "Sparkles",
      title: content[`about_feature_${n}_title`] || "",
      description: content[`about_feature_${n}_description`] || "",
    }))
    .filter((feature) => feature.title);

  const problemItems = [1, 2, 3, 4, 5, 6]
    .map((n) => content[`problem_item_${n}`])
    .filter(Boolean);

  const solutionPoints = [1, 2, 3, 4, 5]
    .map((n) => content[`solution_point_${n}`])
    .filter(Boolean);

  const pricingIncludes = [1, 2, 3, 4, 5, 6]
    .map((n) => content[`pricing_includes_${n}`])
    .filter(Boolean);

  const credentials = splitList(content.agent_credentials);

  const baseUrl = (content.seo_site_url || "https://aether.systems").replace(/\/$/, "");
  const brandName = content.brand_name || "Aether";
  const authorName = content.agent_name || "Aether Founder";
  const authorTitle = content.agent_title || "Founder & Builder";
  const authorEmail = content.agent_email || content.contact_email || "";
  const authorPhotoUrl = content.agent_photo_url || "";
  const authorBio = content.agent_bio || "";
  const authorSpecialties = splitList(content.agent_specialties);
  const authorServiceAreas = splitList(content.agent_service_area);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/#person`,
    name: authorName,
    jobTitle: authorTitle,
    description: authorBio,
    url: baseUrl,
    image: authorPhotoUrl || undefined,
    email: authorEmail || undefined,
    sameAs: [
      content.social_linkedin,
      content.social_instagram,
      content.social_facebook,
      content.social_youtube,
      content.social_tiktok,
    ].filter(Boolean),
    knowsAbout: authorSpecialties.length > 0 ? authorSpecialties : undefined,
    areaServed:
      authorServiceAreas.length > 0
        ? authorServiceAreas.map((area) => ({ "@type": "Place", name: area }))
        : undefined,
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}/#service`,
    name: brandName,
    serviceType: "AI-powered website and business management system",
    description: content.seo_home_description,
    url: baseUrl,
    provider: { "@id": `${baseUrl}/#person` },
    areaServed: { "@type": "Place", name: "Worldwide" },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Small business owners",
    },
    offers: {
      "@type": "Offer",
      name: content.pricing_plan_name || "Aether Base",
      priceSpecification: [
        {
          "@type": "UnitPriceSpecification",
          price: 5000,
          priceCurrency: "USD",
          unitText: "one-time setup",
        },
        {
          "@type": "UnitPriceSpecification",
          price: 350,
          priceCurrency: "USD",
          unitText: "per month",
        },
      ],
    },
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/#webpage`,
    url: `${baseUrl}/`,
    name: content.seo_home_title,
    description: content.seo_home_description,
    mainEntity: { "@id": `${baseUrl}/#service` },
    author: { "@id": `${baseUrl}/#person` },
    publisher: { "@id": `${baseUrl}/#person` },
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={personSchema} />
      <JsonLd data={serviceSchema} />
      <JsonLd data={webPageSchema} />
      <Navbar
        brandName={brandName}
        brandSubtitle={content.brand_subtitle}
        logoUrl={content.brand_logo_url}
        logoWidth={content.brand_logo_width}
        logoHeight={content.brand_logo_height}
        logoBackground={content.brand_logo_background}
        showBrandText={content.brand_header_show_text !== "false"}
      />
      <main id="main-content" tabIndex={-1}>
        <HeroSection
          backgroundImage={content.hero_background_image}
          tagline={content.hero_tagline}
          title={content.hero_title}
          subtitle={content.hero_subtitle}
          description={content.hero_description}
          ctaPrimary={content.hero_cta_primary}
          ctaSecondary={content.hero_cta_secondary}
          primaryHref="#audit"
          secondaryHref="#solution"
        />
        <ProblemSection
          label={content.problem_label}
          title={content.problem_title}
          items={problemItems}
        />
        <SolutionSection
          label={content.solution_label}
          title={content.solution_title}
          description1={content.solution_description_1}
          description2={content.solution_description_2}
          points={solutionPoints}
        />
        <IncludedSection />
        <TechCredibilitySection
          label={content.tech_label}
          title={content.tech_title}
          description={content.tech_description}
          pillarOverrides={[
            {
              title: content.tech_pillar_1_title,
              description: content.tech_pillar_1_description,
            },
            {
              title: content.tech_pillar_2_title,
              description: content.tech_pillar_2_description,
            },
            {
              title: content.tech_pillar_3_title,
              description: content.tech_pillar_3_description,
            },
          ]}
        />
        <ProofSection />
        <PricingSection
          label={content.pricing_label}
          title={content.pricing_title}
          planName={content.pricing_plan_name}
          setupAmount={content.pricing_setup_amount}
          setupLabel={content.pricing_setup_label}
          monthlyAmount={content.pricing_monthly_amount}
          monthlyLabel={content.pricing_monthly_label}
          includesLabel={content.pricing_includes_label}
          includes={pricingIncludes}
          addonTitle={content.pricing_addon_title}
          addonDescription={content.pricing_addon_description}
          capacityNote={content.pricing_capacity_note}
          ctaLabel={content.audit_cta || "Get Your Free AI Readiness Audit"}
          ctaHref="#audit"
        />
        <AboutSection
          label={content.about_label}
          title={content.about_title}
          description1={content.about_description_1}
          description2={content.about_description_2}
          features={aboutFeatures}
          authorName={authorName}
          authorTitle={authorTitle}
          authorPhotoUrl={authorPhotoUrl}
          credentials={credentials}
        />
        {posts[0] && (
          <LatestPostSection
            title={posts[0].title}
            slug={posts[0].slug}
            excerpt={posts[0].excerpt || posts[0].description}
            category={posts[0].category}
            publishedAt={posts[0].publishedAt}
          />
        )}
        <AuditSection
          label={content.audit_label}
          title={content.audit_title}
          description={content.audit_description}
          ctaLabel={content.audit_cta}
          successMessage={content.audit_success_message}
        />
      </main>
      <Footer
        {...brandingFooterProps(content)}
        brandName={brandName}
        brandSubtitle={content.brand_subtitle}
        tagline={content.footer_tagline}
        legalEntity={content.footer_legal_entity}
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
