import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Footer, brandingFooterProps } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/schema-json-ld";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const siteName = content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();
  const name = content.agent_name || "Agent";
  const title = content.agent_page_title || `${name} | ${content.agent_title || "Real Estate Advisor"}`;
  const description =
    content.agent_page_description ||
    `${name} provides real estate guidance for buyers, sellers, and investors.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName,
      images: content.agent_photo_url ? [content.agent_photo_url] : content.seo_og_image ? [content.seo_og_image] : undefined,
    },
  };
}

export default async function EricBecerraPage() {
  const content = await getSiteContent();
  const baseUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");
  const name = content.agent_name || "Eric Becerra";
  const title = content.agent_title || "Real Estate Advisor";
  const email = content.agent_email || content.contact_email;
  const phone = content.agent_phone || content.contact_phone;
  const whatsapp = content.agent_whatsapp || content.agent_whatsapp_url || content.marketing_whatsapp_url;
  const photo = content.agent_photo_url;
  const siteName = content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();
  const bioHtml = sanitizeRichHtml(
    content.agent_bio ||
      `${name} provides real estate guidance for buyers, sellers, and investors.`
  );
  const specialties = (content.agent_specialties || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const serviceAreas = (content.agent_service_areas || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Person", "RealEstateAgent"],
    "@id": `${baseUrl}/agents/eric-becerra#agent`,
    name,
    jobTitle: title,
    url: `${baseUrl}/agents/eric-becerra`,
    image: photo || undefined,
    email,
    telephone: phone,
    worksFor: {
      "@type": "RealEstateAgent",
      name: siteName,
      url: baseUrl,
    },
    description: content.agent_page_description || undefined,
    areaServed: serviceAreas.map((area) => ({ "@type": "Place", name: area })),
    knowsAbout: specialties,
    sameAs: [content.social_facebook, content.social_instagram, content.social_linkedin].filter(Boolean),
  };

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
      <JsonLd data={schema} />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b bg-muted/30 px-4 pb-16 pt-28">
          <div className="container mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.65fr_0.35fr] md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Agent profile
              </p>
              <h1 className="mt-3 text-4xl font-light tracking-tight md:text-6xl">
                {name}
              </h1>
              <p className="mt-4 text-xl text-muted-foreground">{title}</p>
              <div
                className="mt-6 max-w-2xl space-y-4 text-lg leading-8 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground"
                dangerouslySetInnerHTML={{ __html: bioHtml }}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/listings">View listings</Link>
                </Button>
                <Button asChild variant="outline">
                  <a href="#contact-eric">Contact Eric</a>
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border bg-background">
              {photo ? (
                <div className="relative aspect-[4/5]">
                  <Image src={photo} alt={`${name} headshot`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
                </div>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-muted text-muted-foreground">
                  Agent photo coming soon
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            {(specialties.length > 0 ? specialties : [title]).map((specialty) => (
              <article key={specialty} className="rounded-2xl border p-6">
                <h2 className="font-medium">{specialty}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Contact {name} for guidance related to {specialty.toLowerCase()}.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact-eric" className="border-t bg-muted/20 px-4 py-14">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-light">Contact Eric</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {email && (
                <a className="flex items-center gap-3 rounded-xl border bg-background p-4 hover:bg-muted/40" href={`mailto:${email}`}>
                  <Mail className="h-5 w-5" />
                  <span>{email}</span>
                </a>
              )}
              {phone && (
                <a className="flex items-center gap-3 rounded-xl border bg-background p-4 hover:bg-muted/40" href={`tel:${phone}`}>
                  <Phone className="h-5 w-5" />
                  <span>{phone}</span>
                </a>
              )}
              {whatsapp && (
                <a className="flex items-center gap-3 rounded-xl border bg-background p-4 hover:bg-muted/40" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp Eric</span>
                </a>
              )}
              <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
                <MapPin className="h-5 w-5" />
                <span>{content.contact_location || "Baja California"}</span>
              </div>
            </div>
          </div>
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
        whatsappUrl={whatsapp || content.social_whatsapp}
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
