import { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/site-content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const content = await getSiteContent();
  const baseUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");

  return {
    host: baseUrl,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/login", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
