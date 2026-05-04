import { LegalPage } from "@/components/legal-page";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getSiteContent();
  const title = content.accessibility_statement_title || "Accessibility Statement";
  return {
    title,
    description: `${title} for ${content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim()}.`,
  };
}

export default async function AccessibilityPage() {
  const content = await getSiteContent();

  return (
    <LegalPage
      title={content.accessibility_statement_title || "Accessibility Statement"}
      body={content.accessibility_statement_content}
      content={content}
    />
  );
}
