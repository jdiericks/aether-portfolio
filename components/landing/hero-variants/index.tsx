import { ClassicHero } from "./classic";
import { CenteredMinimalHero } from "./centered-minimal";
import { SplitImageHero } from "./split-image";
import { LatestPostSpotlightHero } from "./latest-post-spotlight";
import { GradientCtaHero } from "./gradient-cta";

// ---------------------------------------------------------------------------
// Hero variant catalog — keep in sync with site content key `hero_variant`
// ---------------------------------------------------------------------------

export const HERO_VARIANTS = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Centered tagline + headline + two CTAs over a full-bleed background image. The original Aether look.",
    fields: [
      "hero_background_image",
      "hero_tagline",
      "hero_title",
      "hero_subtitle",
      "hero_description",
      "hero_cta_primary",
      "hero_cta_secondary",
    ],
  },
  {
    id: "centered-minimal",
    name: "Centered minimal",
    description: "Clean centered text on a soft gradient background. No image, more whitespace, calmer.",
    fields: [
      "hero_tagline",
      "hero_title",
      "hero_description",
      "hero_cta_primary",
    ],
  },
  {
    id: "split-image",
    name: "Split image",
    description: "Text on the left, large image on the right. Strong for product or service shots.",
    fields: [
      "hero_image_url",
      "hero_tagline",
      "hero_title",
      "hero_description",
      "hero_cta_primary",
      "hero_cta_secondary",
    ],
  },
  {
    id: "latest-post-spotlight",
    name: "Latest post spotlight",
    description:
      "Headline plus a card featuring your most recent blog post. Doubles as a built-in CTA to your insights.",
    fields: [
      "hero_tagline",
      "hero_title",
      "hero_description",
      "hero_cta_primary",
      "hero_latest_post_label",
      "hero_latest_post_cta",
    ],
  },
  {
    id: "gradient-cta",
    name: "Gradient CTA",
    description:
      "High-contrast brand-colored background with an oversized CTA. Designed to maximize lead conversion.",
    fields: ["hero_tagline", "hero_title", "hero_description", "hero_cta_primary"],
  },
] as const;

export type HeroVariantId = (typeof HERO_VARIANTS)[number]["id"];

export const DEFAULT_HERO_VARIANT: HeroVariantId = "classic";

export function isHeroVariantId(value: string): value is HeroVariantId {
  return HERO_VARIANTS.some((v) => v.id === value);
}

// ---------------------------------------------------------------------------
// Common hero data passed to every variant
// ---------------------------------------------------------------------------

export interface HeroData {
  variant: HeroVariantId;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  primaryHref: string;
  secondaryHref: string;
  backgroundImage: string;
  heroImage: string;
  showLatestPost: boolean;
  latestPostLabel: string;
  latestPostCta: string;
  latestPost?: {
    title: string;
    slug: string;
    excerpt?: string | null;
    category?: string | null;
    publishedAt?: Date | string | null;
  } | null;
}

export function heroDataFromContent(
  content: Record<string, string>,
  latestPost?: HeroData["latestPost"],
): HeroData {
  const rawVariant = (content.hero_variant || DEFAULT_HERO_VARIANT).trim();
  const variant: HeroVariantId = isHeroVariantId(rawVariant)
    ? rawVariant
    : DEFAULT_HERO_VARIANT;
  return {
    variant,
    tagline: content.hero_tagline ?? "",
    title: content.hero_title ?? "",
    subtitle: content.hero_subtitle ?? "",
    description: content.hero_description ?? "",
    ctaPrimary: content.hero_cta_primary ?? "Get started",
    ctaSecondary: content.hero_cta_secondary ?? "",
    primaryHref: content.hero_cta_primary_href || "#audit",
    secondaryHref: content.hero_cta_secondary_href || "#solution",
    backgroundImage: content.hero_background_image ?? "",
    heroImage: content.hero_image_url ?? "",
    showLatestPost: (content.hero_show_latest_post ?? "true") !== "false",
    latestPostLabel: content.hero_latest_post_label || "Latest insight",
    latestPostCta: content.hero_latest_post_cta || "Read article",
    latestPost: latestPost ?? null,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function HeroDispatcher(props: HeroData) {
  switch (props.variant) {
    case "centered-minimal":
      return <CenteredMinimalHero {...props} />;
    case "split-image":
      return <SplitImageHero {...props} />;
    case "latest-post-spotlight":
      return <LatestPostSpotlightHero {...props} />;
    case "gradient-cta":
      return <GradientCtaHero {...props} />;
    case "classic":
    default:
      return <ClassicHero {...props} />;
  }
}
