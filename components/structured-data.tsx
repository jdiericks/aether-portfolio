import { JsonLdScript } from "@/components/schema-json-ld";

interface StructuredDataProps {
  siteUrl?: string;
  siteName?: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  email?: string;
  telephone?: string;
  location?: string;
}

export function LocalBusinessSchema({
  siteUrl = "https://diericksrealty.com",
  siteName = "Diericks Realty",
  description = "Boutique real estate advisory for buyers, sellers, and investors in Ensenada and Baja California.",
  imageUrl = "/og-image.jpg",
  email = "hello@diericksrealty.com",
  telephone = "+52 646 XXX XXXX",
  location = "Ensenada, Baja California",
}: StructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": siteUrl,
    name: siteName,
    description,
    url: siteUrl,
    telephone,
    email,
    image: imageUrl,
    priceRange: "$$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: location,
      addressRegion: location,
      addressCountry: "MX",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 31.8667,
      longitude: -116.5964,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Ensenada",
      },
      {
        "@type": "City",
        name: "Valle de Guadalupe",
      },
      {
        "@type": "City",
        name: "Rosarito",
      },
      {
        "@type": "City",
        name: "Tijuana",
      },
    ],
    sameAs: [
      // Add social media URLs here
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "18:00",
    },
  };

  return (
    <JsonLdScript data={schema} />
  );
}

export function RealEstateServiceSchema({
  siteUrl = "https://diericksrealty.com",
  siteName = "Diericks Realty",
  description = "Residential buying, selling, relocation, and investment advisory in Baja California.",
}: StructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: siteName,
    description,
    url: siteUrl,
    serviceType: ["Buyer Representation", "Seller Representation", "Relocation Services"],
    areaServed: {
      "@type": "Place",
      name: "Baja California, Mexico",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Real Estate Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Buyer Representation",
            description: "Guided home search, property tours, offer strategy, and closing coordination",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Listing Representation",
            description: "Pricing strategy, launch preparation, marketing, negotiation, and closing support",
          },
        },
      ],
    },
  };

  return (
    <JsonLdScript data={schema} />
  );
}

export function WebsiteSchema({
  siteUrl = "https://diericksrealty.com",
  siteName = "Diericks Realty",
  description = "Boutique real estate website for featured listings and private property galleries",
  logoUrl,
}: StructuredDataProps) {
  const fallbackLogoUrl = `${siteUrl.replace(/\/$/, "")}/icon.png`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description,
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: logoUrl || fallbackLogoUrl,
      },
    },
  };

  return (
    <JsonLdScript data={schema} />
  );
}
