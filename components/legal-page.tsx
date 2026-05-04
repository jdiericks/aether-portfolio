import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import type { SiteContentMap } from "@/lib/site-content";

interface LegalPageProps {
  title: string;
  body: string;
  content: SiteContentMap;
}

export function LegalPage({ title, body, content }: LegalPageProps) {
  const sanitizedBody = sanitizeRichHtml(body);

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
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-light tracking-tight">{title}</h1>
        <div
          className="prose prose-neutral mt-8 max-w-none rounded-2xl border bg-background p-6 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        />
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
          content.social_whatsapp ||
          content.whatsapp_contact_url
        }
        copyrightText={content.footer_copyright}
        privacyUrl="/privacy"
        termsUrl="/terms"
        sitemapUrl="/site-map"
        accessibilityUrl="/accessibility"
      />
    </div>
  );
}
