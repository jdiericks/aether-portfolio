import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  hero_background_image:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
  hero_tagline: "Boutique Real Estate Advisory",
  hero_title: "Diericks",
  hero_subtitle: "Realty",
  hero_description:
    "Curated homes, neighborhood insight, and private property tours for buyers, sellers, and investors.",
  hero_cta_primary: "View Listings",
  hero_cta_secondary: "Schedule a Consult",
  about_label: "Why Work With Us",
  about_title: "Market guidance for every move.",
  about_description_1:
    "We help clients navigate competitive real estate decisions with data-backed pricing, polished listing launches, and thoughtful buyer representation.",
  about_description_2:
    "From first showings to final signatures, our team coordinates the details that make buying or selling feel clear, calm, and strategic.",
  about_feature_1_icon: "Home",
  about_feature_1_title: "Curated Listings",
  about_feature_1_description:
    "A focused search strategy built around lifestyle, commute, schools, and long-term value.",
  about_feature_2_icon: "BadgeDollarSign",
  about_feature_2_title: "Pricing Strategy",
  about_feature_2_description:
    "Comparable sales, neighborhood demand, and launch timing shape every offer and listing price.",
  about_feature_3_icon: "MapPin",
  about_feature_3_title: "Neighborhood Expertise",
  about_feature_3_description:
    "Local context for schools, amenities, zoning, and the streets that move fastest.",
  about_feature_4_icon: "KeyRound",
  about_feature_4_title: "Closing Coordination",
  about_feature_4_description:
    "A steady process for inspections, negotiations, lender milestones, and move-in planning.",
  contact_label: "Start Your Search",
  contact_title: "Tell us about your next move",
  contact_description:
    "Share what you want to buy, sell, or invest in, and we'll follow up with tailored next steps.",
  contact_email: "hello@diericksrealty.com",
  contact_phone: "+1 555 014 8842",
  contact_phone_href: "tel:+15550148842",
  contact_location: "Ensenada, Baja California",
  contact_note:
    "Serving residential buyers, sellers, and investors across Ensenada and Baja California.",
  brand_name: "Diericks",
  brand_subtitle: "Realty",
  footer_location: "Ensenada, Baja California",
  social_instagram: "",
  social_facebook: "",
  theme_header_transparent_bg: "transparent",
  theme_header_transparent_text: "#ffffff",
  theme_header_bg: "rgba(255, 255, 255, 0.95)",
  theme_header_text: "#171717",
  theme_header_border: "#e5e5e5",
  theme_footer_social_bg: "#e5e5e5",
  theme_footer_social_color: "#171717",
  theme_footer_social_hover_bg: "#d4d4d4",
  theme_footer_social_hover_color: "#171717",
  theme_footer_social_radius: "9999px",
  theme_footer_social_size: "2.5rem",
  theme_footer_social_icon_size: "1.25rem",
  theme_section_bg: "#ffffff",
  theme_section_text: "#171717",
  theme_card_radius: "1rem",
};

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  const email = process.env.ADMIN_EMAIL ?? (isProduction ? null : "admin@example.com");
  const password = process.env.ADMIN_PASSWORD ?? (isProduction ? null : "admin123");

  if (!email || !password) {
    throw new Error(
      "Missing admin seed credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding in production."
    );
  }
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Admin user already exists");
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin",
      },
    });

    console.log("Admin user created successfully");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("\nIMPORTANT: Change these credentials in production!");
  }

  const existingContent = await prisma.siteContent.count();
  if (existingContent === 0) {
    await prisma.$transaction(
      Object.entries(SITE_CONTENT_DEFAULTS).map(([key, value]) =>
        prisma.siteContent.create({ data: { key, value } })
      )
    );
    console.log("Default site content seeded");
  } else {
    console.log("Site content already exists, skipping seed");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
