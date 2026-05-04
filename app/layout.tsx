import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import {
  LocalBusinessSchema,
  RealEstateServiceSchema,
  WebsiteSchema,
} from "@/components/structured-data";
import { Analytics as AnalyticsScripts } from "@/components/analytics";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { GoogleTranslateWidget } from "@/components/google-translate-widget";
import { SiteAnnouncements } from "@/components/site-announcements";
import { SkipLinks } from "@/components/skip-links";
import { ThemeStyles } from "@/components/theme-styles";
import { TrackingProvider } from "@/components/tracking-provider";
import { BackToTop } from "@/components/back-to-top";
import { getSiteContent } from "@/lib/site-content";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const siteUrl = content.seo_site_url || "https://diericksrealty.com";
  const siteName =
    content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();
  const title = content.seo_title_default || siteName;
  const description =
    content.seo_description_default ||
    content.seo_description ||
    "Boutique real estate advisory for buyers, sellers, and investors.";
  const image = content.seo_og_image || "/og-image.jpg";
  const imageAlt = content.seo_og_image_alt || `${siteName} social preview`;
  const faviconUrl = content.brand_favicon_url || "/favicon.ico";
  const logoUrl = content.brand_logo_url || faviconUrl;
  const keywords = content.seo_keywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    metadataBase: new URL(siteUrl),
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: logoUrl,
    },
    title: {
      default: title,
      template: content.seo_title_template || `%s | ${siteName}`,
    },
    description,
    keywords,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo_twitter_title || title,
      description: content.seo_twitter_description || description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: content.seo_google_verification || undefined,
      yandex: content.seo_yandex_verification || undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contentPromise = getSiteContent();

  return (
    <html lang="en">
      <head>
        <BrandIcons contentPromise={contentPromise} />
        <Theme contentPromise={contentPromise} />
        <StructuredData contentPromise={contentPromise} />
        <Analytics contentPromise={contentPromise} />
        <LLMDiscovery contentPromise={contentPromise} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SkipLinks />
        <Providers>
          <TrackingProvider />
          <Announcements contentPromise={contentPromise} />
          <div id="main-content">{children}</div>
        </Providers>
        <CookieConsent contentPromise={contentPromise} />
        <TranslateWidget contentPromise={contentPromise} />
        <FloatingWhatsApp contentPromise={contentPromise} />
        <BackToTop />
      </body>
    </html>
  );
}

async function StructuredData({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;
  const siteUrl = content.seo_site_url || "https://diericksrealty.com";
  const siteName = content.seo_site_name || `${content.brand_name} ${content.brand_subtitle}`.trim();
  const description =
    content.seo_description_default ||
    content.seo_description ||
    "Boutique real estate advisory for buyers, sellers, and investors.";
  const imageUrl = content.seo_og_image || "/og-image.jpg";

  return (
    <>
      <LocalBusinessSchema
        siteUrl={siteUrl}
        siteName={siteName}
        description={description}
        imageUrl={imageUrl}
        logoUrl={content.brand_logo_url || undefined}
        email={content.contact_email}
        telephone={content.contact_phone}
        location={content.contact_location}
      />
      <RealEstateServiceSchema
        siteUrl={siteUrl}
        siteName={siteName}
        description={description}
      />
      <WebsiteSchema
        siteUrl={siteUrl}
        siteName={siteName}
        description={description}
        logoUrl={content.brand_logo_url || undefined}
      />
    </>
  );
}

async function BrandIcons({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;
  const faviconUrl = content.brand_favicon_url || "/favicon.ico";

  return (
    <>
      <link rel="icon" href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" href={content.brand_logo_url || faviconUrl} />
    </>
  );
}

async function Theme({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;
  return <ThemeStyles content={content} />;
}

async function Announcements({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;
  return <SiteAnnouncements content={content} />;
}

async function Analytics({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;

  return (
    <AnalyticsScripts content={content} />
  );
}

async function LLMDiscovery({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;
  const siteUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");

  return (
    <>
      <link
        rel="alternate"
        type="text/markdown"
        title="LLM-friendly site guide"
        href={`${siteUrl}/llms.txt`}
      />
      <link
        rel="alternate"
        type="text/markdown"
        title="Full LLM context"
        href={`${siteUrl}/llms-full.txt`}
      />
    </>
  );
}

async function FloatingWhatsApp({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;

  return (
    <FloatingWhatsAppButton
      href={
        content.marketing_whatsapp_url ||
        content.social_whatsapp ||
        content.agent_whatsapp ||
        content.agent_whatsapp_url ||
        content.whatsapp_contact_url ||
        content.contact_phone_href
      }
      label={content.marketing_whatsapp_label || content.whatsapp_contact_label}
    />
  );
}

async function CookieConsent({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;

  return (
    <CookieConsentBanner
      enabled={content.cookie_consent_enabled !== "false"}
      message={content.cookie_consent_message}
      acceptLabel={content.cookie_consent_accept_label}
      privacyUrl={content.footer_privacy_url || "/privacy"}
    />
  );
}

async function TranslateWidget({
  contentPromise,
}: {
  contentPromise: Promise<Record<string, string>>;
}) {
  const content = await contentPromise;

  return (
    <GoogleTranslateWidget
      enabled={content.translation_google_enabled !== "false"}
      languages={content.translation_google_languages || "en,es"}
      label={content.translation_widget_label || "Translate"}
    />
  );
}
