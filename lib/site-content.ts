import { prisma } from "./prisma";
import { isUnavailablePrismaReadError } from "./prisma-errors";

export const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  // Hero
  hero_background_image: "",
  hero_tagline: "AI-Powered Business Systems",
  hero_title: "Aether",
  hero_subtitle: "Run your business by talking to it",
  hero_description:
    "Aether is an AI-powered business system that manages your website, content, social media, and SEO — all through conversation. Built on the technical foundations Google actually rewards.",
  hero_cta_primary: "Get Your Free AI Readiness Audit",
  hero_cta_secondary: "See how it works",

  // The Problem section
  problem_label: "Sound familiar?",
  problem_title: "You're a serious operator stuck running a website like it's 2014",
  problem_item_1: "You're juggling too many tools that don't talk to each other",
  problem_item_2: "Your online presence doesn't reflect the quality of your actual business",
  problem_item_3:
    "You don't have time to manage content, social media, and SEO consistently",
  problem_item_4: "You're not ready to hire a marketing person — but you need one",
  problem_item_5:
    "You're using AI everywhere else in your business — why not your website?",
  problem_item_6:
    "Your current site isn't showing up on Google and you don't know why",

  // The Solution section
  solution_label: "The Aether System",
  solution_title: "One system. One conversation. Everything handled.",
  solution_description_1:
    "Aether is a white-labeled AI-powered business system built into a modern, fast website — branded entirely for your company. Instead of logging into five different tools, you just talk to it. Update your site, publish a social post, check your SEO — all through a single AI interface you or your team can use.",
  solution_description_2:
    "But unlike most AI website tools, Aether is built on the technical foundations Google actually rewards. Every site ships with JSON-LD structured data, WCAG accessibility compliance, and Core Web Vitals performance built in — not bolted on as an afterthought.",
  solution_point_1: "Your brand, your domain, your identity — fully white-labeled",
  solution_point_2: "AI that manages your digital presence through conversation",
  solution_point_3:
    "JSON-LD structured data, accessibility, and performance built in by default",
  solution_point_4: "Built and maintained personally — not handed off to a team",
  solution_point_5: "Limited to 10 clients so every one gets full attention",

  // About section (rewired)
  about_label: "Why I built this",
  about_title: "Built by someone who has actually shipped this work",
  about_description_1:
    "I've been building websites professionally for nearly a decade. Over 20 production sites shipped — for local businesses, e-commerce brands, real estate companies, and public enterprises where precision isn't optional.",
  about_description_2:
    "I didn't get here through a degree. I got here by doing the work. Accessibility compliance for a major client taught me that the technical foundation of a site matters more than almost anything else. JSON-LD structured data, Core Web Vitals, WCAG standards — I implemented all of it in production, on real sites, with real stakes. Then I started building something for myself: an AI to run the website, content, social, and SEO from a single conversation. That became Aether.",
  about_feature_1_icon: "Sparkles",
  about_feature_1_title: "Conversational AI",
  about_feature_1_description:
    "Update content, publish posts, and manage your digital presence by talking to the system.",
  about_feature_2_icon: "Award",
  about_feature_2_title: "Enterprise-grade foundations",
  about_feature_2_description:
    "WCAG 2.1 AA, JSON-LD schema, and Core Web Vitals performance built in from day one.",
  about_feature_3_icon: "Users",
  about_feature_3_title: "Personal attention",
  about_feature_3_description:
    "Capped at 10 clients at a time. Every site is built and maintained personally — no ticket queue.",
  about_feature_4_icon: "Star",
  about_feature_4_title: "Modern stack",
  about_feature_4_description:
    "Next.js architecture, indexable by default, deployed to a globally fast edge.",

  // Technical credibility (Three-column callouts)
  tech_label: "Built the way Google expects",
  tech_title: "Not the way most agencies cut corners",
  tech_description:
    "Most small business websites fail on Google before a single keyword even matters. The technical foundation is wrong. Pages aren't structured correctly. There's no schema data telling Google what the content means. Load times are too slow. Accessibility failures trigger ranking penalties. Every Aether site is built to avoid all of that by default.",
  tech_pillar_1_title: "JSON-LD Structured Data",
  tech_pillar_1_description:
    "Every page ships with schema markup that tells Google exactly what your business is, what you offer, and how to display it in search results. Most sites don't have this at all.",
  tech_pillar_2_title: "WCAG Accessibility",
  tech_pillar_2_description:
    "Accessibility isn't just a legal requirement — it's a ranking signal. Every Aether site meets WCAG 2.1 AA standards out of the box.",
  tech_pillar_3_title: "Core Web Vitals",
  tech_pillar_3_description:
    "Google measures how fast and stable your site feels to real users. Aether sites are built on Next.js and optimized for top Core Web Vitals scores from day one.",

  // Pricing
  pricing_label: "Pricing",
  pricing_title: "Simple, transparent pricing",
  pricing_plan_name: "Aether Base",
  pricing_setup_amount: "$5,000",
  pricing_setup_label: "one-time setup",
  pricing_monthly_amount: "$350",
  pricing_monthly_label: "per month — hosting, maintenance, and support",
  pricing_includes_label: "Includes everything in the features list — including:",
  pricing_includes_1: "Modern Next.js website with JSON-LD structured data on every page",
  pricing_includes_2: "WCAG 2.1 AA accessibility compliance built in",
  pricing_includes_3: "Core Web Vitals performance tuned from day one",
  pricing_includes_4: "Conversational AI for site, content, social, and SEO",
  pricing_includes_5: "Built-in analytics and team access",
  pricing_includes_6: "Ongoing support directly from the person who built it",
  pricing_addon_title: "Custom Add-ons",
  pricing_addon_description:
    "Additional integrations and MCP features available based on your needs. Scoped and quoted separately.",
  pricing_capacity_note:
    "I take on a maximum of 10 clients at a time. This isn't a limitation — it's a commitment. Every client gets my full attention.",

  // Audit / Lead magnet section
  audit_label: "Free AI Readiness Audit",
  audit_title: "Not sure if Aether is right for you?",
  audit_description:
    "Start with a free AI Readiness Audit. I'll look at how your business currently handles its online presence — your website, your tools, your SEO setup — and show you exactly where an AI-managed system could save you time and money. No pitch. Just clarity.",
  audit_cta: "Get Your Free AI Readiness Audit",
  audit_success_message:
    "Thanks — I'll review your answers and get back to you within 48 hours with a personalised summary.",

  // Contact
  contact_label: "Free AI Readiness Audit",
  contact_title: "Not sure if Aether is right for you?",
  contact_description:
    "Start with a free AI Readiness Audit. No pitch. Just clarity on where an AI-managed system would save your business time and money.",
  contact_email: "hello@aether.systems",
  contact_phone: "",
  contact_phone_href: "",
  contact_location: "Remote — serving small businesses worldwide",
  contact_note:
    "Aether is intentionally limited to 10 active clients. The audit is free and there is no obligation.",

  // Brand / Footer / Social
  brand_name: "Aether",
  brand_subtitle: "",
  brand_logo_url: "",
  brand_logo_width: "40",
  brand_logo_height: "40",
  brand_logo_background: "rgba(255, 255, 255, 0.8)",
  brand_logo_radius: "0.25rem",
  brand_logo_padding: "0px",
  brand_header_show_text: "true",
  brand_favicon_url: "",
  footer_tagline: "Aether — Run your business by talking to it.",
  footer_legal_entity: "Aether is a product of CTRL ALT DEFEAT LLC.",
  footer_location: "",
  footer_description:
    "An AI-powered business system that manages your website, content, social media, and SEO — all through conversation.",
  footer_copyright: "",
  footer_privacy_url: "/privacy",
  footer_terms_url: "/terms",
  footer_sitemap_url: "/site-map",
  footer_show_privacy_link: "true",
  footer_show_terms_link: "true",
  footer_show_sitemap_link: "true",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
  social_youtube: "",
  social_linkedin: "",
  social_whatsapp: "",
  whatsapp_contact_url: "",
  whatsapp_contact_label: "WhatsApp us",
  marketing_whatsapp_url: "",
  marketing_whatsapp_label: "",
  agent_name: "Your Name",
  agent_title: "Founder & Builder, Aether",
  agent_email: "hello@aether.systems",
  agent_phone: "",
  agent_whatsapp: "",
  agent_whatsapp_url: "",
  agent_photo_url: "",
  agent_slug: "founder",
  agent_bio:
    "Self-taught web developer with nearly a decade of professional experience. Over 20 production sites shipped — from local businesses and e-commerce to public enterprises with WCAG 2.1 AA accessibility requirements. JSON-LD structured data, Core Web Vitals optimization, and modern Next.js architecture, all implemented in production. I built Aether to give serious small businesses the same technical foundation Google rewards public companies for, paired with an AI that runs the day-to-day so the owner doesn't have to.",
  agent_service_area: "Remote — North America, EU, LATAM",
  agent_specialties:
    "AI-managed websites, JSON-LD structured data, WCAG 2.1 AA accessibility, Core Web Vitals optimization, Next.js, PHP",
  agent_credentials:
    "~10 years professional web development, 20+ production sites shipped, Enterprise WCAG 2.1 AA accessibility, JSON-LD structured data implemented in production, Core Web Vitals optimization on live sites, PHP and Next.js specialist",

  // SEO / Metadata
  seo_site_url: "https://aether.systems",
  seo_site_name: "Aether",
  seo_title_default: "Aether | AI-Powered Business Systems for Small Business",
  seo_title_template: "%s | Aether",
  seo_description:
    "Aether is an AI-powered business system that manages your website, content, social media, and SEO through conversation. Built with JSON-LD structured data, WCAG accessibility, and Core Web Vitals performance for serious small businesses.",
  seo_keywords:
    "AI-powered website for small business, AI business management system, AI managed website, small business AI tools, JSON-LD structured data small business, accessible website for small business, AI website builder",
  seo_og_image: "/og-image.jpg",
  seo_og_image_alt: "Aether — AI-powered business system for small business",
  seo_twitter_title: "Aether | AI-Powered Business Systems for Small Business",
  seo_twitter_description:
    "Run your business by talking to it. AI-managed website, content, social, and SEO — built on the technical foundations Google actually rewards.",
  seo_home_title: "Aether | AI-Powered Business Systems for Small Business",
  seo_home_description:
    "Aether is an AI-powered business system that manages your website, content, social media, and SEO through conversation. Built with JSON-LD structured data, WCAG accessibility, and Core Web Vitals performance — for a limited number of serious small businesses.",
  seo_listings_title: "Aether in the wild",
  seo_listings_description:
    "Real Aether deployments across small business industries — every site built with JSON-LD structured data, WCAG accessibility, and Core Web Vitals performance.",
  seo_home_og_title: "",
  seo_listings_og_title: "",
  seo_google_verification: "",
  seo_yandex_verification: "",
  seo_bing_verification: "",
  analytics_google_id: "",
  analytics_meta_pixel_id: "",
  marketing_google_analytics_id: "",
  marketing_meta_pixel_id: "",
  marketing_google_tag_manager_id: "",
  marketing_google_ads_id: "",
  marketing_google_ads_conversion_label: "",
  tracking_cookie_consent_enabled: "true",
  tracking_cookie_consent_text:
    "We use light analytics to understand site activity and improve the Aether product experience.",
  tracking_cookie_consent_accept_label: "Accept",
  tracking_cookie_consent_decline_label: "Decline",

  // Accessibility / Announcements
  accessibility_skip_links_enabled: "true",
  accessibility_focus_ring_color: "#2563eb",
  accessibility_focus_ring_width: "3px",
  accessibility_focus_ring_offset: "2px",
  accessibility_text_size: "normal",
  accessibility_underline_links: "false",
  accessibility_statement_title: "Accessibility Statement",
  accessibility_statement_content:
    "Every Aether site is built to WCAG 2.1 AA standards. If you experience any difficulty accessing this site or any site I have built, please contact me directly so I can address it personally.",
  footer_accessibility_url: "/accessibility",
  footer_show_accessibility_link: "true",
  announcement_minor_enabled: "false",
  announcement_minor_text: "",
  announcement_minor_link_label: "",
  announcement_minor_link_url: "",
  announcement_major_enabled: "false",
  announcement_major_id: "site-announcement",
  announcement_major_title: "",
  announcement_major_content: "",
  announcement_major_button_label: "Close",

  // Translation / Currency
  translation_google_enabled: "true",
  translation_google_languages: "en,es",
  translation_widget_label: "Translate",
  currency_switch_enabled: "true",
  currency_usd_to_mxn_rate: "17.5",
  currency_default_display: "listing",

  // Legal
  legal_privacy_title: "Privacy Policy",
  legal_privacy_content:
    "This privacy policy explains how Aether collects, uses, and protects information submitted through this site, including AI Readiness Audit submissions. Update this content in Admin > Website > Legal.",
  legal_privacy_body:
    "This privacy policy explains how Aether collects, uses, and protects information submitted through this site, including AI Readiness Audit submissions. Update this content in Admin > Website > Legal.",
  legal_terms_title: "Terms of Service",
  legal_terms_content:
    "These terms describe the conditions for using the Aether website and engaging with the Aether product. Update this content in Admin > Website > Legal.",
  legal_terms_body:
    "These terms describe the conditions for using the Aether website and engaging with the Aether product. Update this content in Admin > Website > Legal.",

  // Theme
  theme_font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
  theme_heading_font_family: "Inter, ui-sans-serif, system-ui, sans-serif",
  theme_font_sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  theme_font_heading: "Inter, ui-sans-serif, system-ui, sans-serif",
  theme_background: "#ffffff",
  theme_foreground: "#171717",
  theme_card: "#ffffff",
  theme_card_foreground: "#171717",
  theme_primary: "#171717",
  theme_primary_foreground: "#ffffff",
  theme_secondary: "#f5f5f5",
  theme_secondary_foreground: "#171717",
  theme_muted: "#f5f5f5",
  theme_muted_foreground: "#737373",
  theme_accent: "#f5f5f5",
  theme_accent_foreground: "#171717",
  theme_border: "#e5e5e5",
  theme_input: "#e5e5e5",
  theme_ring: "#a3a3a3",
  theme_radius: "0.625rem",
  theme_button_radius: "0.625rem",
  theme_button_background: "#171717",
  theme_button_foreground: "#ffffff",
  theme_button_bg: "#171717",
  theme_button_text: "#ffffff",
  theme_button_hover_bg: "#262626",
  theme_header_background: "rgba(255, 255, 255, 0.95)",
  theme_header_foreground: "#171717",
  theme_header_transparent_bg: "transparent",
  theme_header_bg: "rgba(255, 255, 255, 0.95)",
  theme_header_text: "#171717",
  theme_header_transparent_text: "#ffffff",
  theme_header_border: "#e5e5e5",
  theme_footer_background: "#f5f5f5",
  theme_footer_foreground: "#171717",
  theme_footer_bg: "#f5f5f5",
  theme_footer_text: "#171717",
  theme_footer_muted_text: "#737373",
  theme_footer_border: "#e5e5e5",
  theme_footer_social_bg: "#e5e5e5",
  theme_footer_social_color: "#171717",
  theme_footer_social_text: "#171717",
  theme_footer_social_hover_bg: "#d4d4d4",
  theme_footer_social_hover_color: "#171717",
  theme_footer_social_hover_text: "#171717",
  theme_footer_social_radius: "9999px",
  theme_footer_social_size: "2.5rem",
  theme_footer_social_icon_size: "1.25rem",
  theme_hero_overlay: "rgba(0, 0, 0, 0.4)",
  theme_hero_foreground: "#ffffff",
  theme_hero_text: "#ffffff",
  theme_hero_muted_text: "rgba(255, 255, 255, 0.85)",
  theme_hero_button_background: "#ffffff",
  theme_hero_button_foreground: "#000000",
  theme_hero_button_bg: "#ffffff",
  theme_hero_button_text: "#000000",
  theme_hero_secondary_button_border: "#ffffff",
  theme_section_bg: "#ffffff",
  theme_section_text: "#171717",
  theme_about_background: "rgba(245, 245, 245, 0.3)",
  theme_contact_background: "#ffffff",
  theme_card_radius: "1rem",
};

export type SiteContentMap = Record<string, string>;

export async function getSiteContent(): Promise<SiteContentMap> {
  const content: SiteContentMap = { ...SITE_CONTENT_DEFAULTS };

  if (!process.env.DATABASE_URL) {
    return content;
  }

  try {
    const rows = await prisma.siteContent.findMany();
    for (const row of rows) {
      content[row.key] = row.value;
    }
  } catch (error) {
    if (!isUnavailablePrismaReadError(error)) {
      throw error;
    }
  }

  return content;
}
