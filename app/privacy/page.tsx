import { LegalPage } from "@/components/legal-page";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getSiteContent();
  const title = content.legal_privacy_title || "Privacy Policy";
  return {
    title,
    description: `${title} for ${content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim()}.`,
  };
}

export default async function PrivacyPage() {
  const content = await getSiteContent();

  return (
    <LegalPage
      title={content.legal_privacy_title || "Privacy Policy"}
      body={content.legal_privacy_content || content.legal_privacy_body}
      content={content}
    />
  );
}
