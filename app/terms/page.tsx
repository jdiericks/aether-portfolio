import { LegalPage } from "@/components/legal-page";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getSiteContent();
  const title = content.legal_terms_title || "Terms of Service";
  return {
    title,
    description: `${content.brand_name} ${content.brand_subtitle} terms of service.`,
  };
}

export default async function TermsPage() {
  const content = await getSiteContent();

  return (
    <LegalPage
      title={content.legal_terms_title || "Terms of Service"}
      body={content.legal_terms_content || content.legal_terms_body}
      content={content}
    />
  );
}
