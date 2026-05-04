import type { SiteContentMap } from "@/lib/site-content";

interface ThemeStylesProps {
  content: SiteContentMap;
}

const cssVarMap: Record<string, string> = {
  theme_background: "--background",
  theme_foreground: "--foreground",
  theme_card: "--card",
  theme_card_foreground: "--card-foreground",
  theme_primary: "--primary",
  theme_primary_foreground: "--primary-foreground",
  theme_secondary: "--secondary",
  theme_secondary_foreground: "--secondary-foreground",
  theme_muted: "--muted",
  theme_muted_foreground: "--muted-foreground",
  theme_accent: "--accent",
  theme_accent_foreground: "--accent-foreground",
  theme_border: "--border",
  theme_input: "--input",
  theme_ring: "--ring",
  theme_radius: "--radius",
  theme_radius__button: "--site-button-radius",
  theme_radius__section: "--site-section-radius",
  theme_font_sans: "--font-geist-sans",
  theme_font_sans__site: "--site-font-family",
  theme_font_mono: "--font-geist-mono",
  theme_font_heading: "--site-heading-font-family",
  theme_button_radius: "--theme-button-radius",
  theme_button_radius__site: "--site-button-radius",
  theme_button_bg: "--theme-button-bg",
  theme_button_bg__primary: "--primary",
  theme_button_text: "--theme-button-text",
  theme_button_text__primary: "--primary-foreground",
  theme_button_hover_bg: "--theme-button-hover-bg",
  theme_header_transparent_bg: "--site-header-transparent-bg",
  theme_header_bg: "--theme-header-bg",
  theme_header_bg__site: "--site-header-scrolled-bg",
  theme_header_text: "--theme-header-text",
  theme_header_text__site: "--site-header-scrolled-fg",
  theme_header_transparent_text: "--site-header-transparent-fg",
  theme_header_scrolled_bg: "--theme-header-scrolled-bg",
  theme_header_scrolled_bg__site: "--site-header-scrolled-bg",
  theme_header_scrolled_text: "--theme-header-scrolled-text",
  theme_header_scrolled_text__site: "--site-header-scrolled-fg",
  theme_header_border: "--site-header-border",
  theme_footer_bg: "--theme-footer-bg",
  theme_footer_bg__site: "--site-footer-bg",
  theme_footer_text: "--theme-footer-text",
  theme_footer_text__site: "--site-footer-fg",
  theme_footer_muted_text: "--theme-footer-muted",
  theme_footer_muted_text__site: "--site-footer-muted-fg",
  theme_footer_muted: "--theme-footer-muted",
  theme_footer_border: "--theme-footer-border",
  theme_footer_border__site: "--site-footer-border",
  theme_footer_social_bg: "--site-footer-social-bg",
  theme_footer_social_color: "--site-footer-social-fg",
  theme_footer_social_text: "--site-footer-social-fg",
  theme_footer_social_hover_bg: "--site-footer-social-hover-bg",
  theme_footer_social_hover_color: "--site-footer-social-hover-fg",
  theme_footer_social_hover_text: "--site-footer-social-hover-fg",
  theme_footer_social_radius: "--site-footer-social-radius",
  theme_footer_social_size: "--site-footer-social-size",
  theme_footer_social_icon_size: "--site-footer-social-icon-size",
  theme_hero_bg: "--theme-hero-bg",
  theme_hero_overlay: "--theme-hero-overlay",
  theme_hero_overlay__site: "--hero-overlay",
  theme_hero_text: "--theme-hero-text",
  theme_hero_text__site: "--hero-text",
  theme_hero_muted_text: "--theme-hero-muted",
  theme_hero_muted_text__site: "--hero-muted-text",
  theme_hero_muted: "--theme-hero-muted",
  theme_hero_button_bg: "--theme-hero-button-bg",
  theme_hero_button_bg__site: "--hero-primary-button-bg",
  theme_hero_button_text: "--theme-hero-button-text",
  theme_hero_button_text__site: "--hero-primary-button-text",
  theme_hero_secondary_button_border: "--theme-hero-secondary-button-border",
  theme_hero_secondary_button_border__site:
    "--hero-secondary-button-border",
  theme_section_bg: "--theme-section-bg",
  theme_section_bg__site: "--section-bg",
  theme_section_text: "--theme-section-text",
  theme_card_radius: "--theme-card-radius",
  theme_card_radius__site: "--card-radius",
  theme_about_background: "--section-alt-bg",
  theme_contact_background: "--section-bg",
  accessibility_focus_ring_color: "--accessibility-focus-ring-color",
  accessibility_focus_ring_width: "--accessibility-focus-ring-width",
  accessibility_focus_ring_offset: "--accessibility-focus-ring-offset",
  accessibility_text_scale: "--accessibility-text-scale",
  brand_logo_radius: "--site-logo-radius",
  brand_logo_padding: "--site-logo-padding",
};

function escapeCssValue(value: string) {
  return value.replace(/</g, "").replace(/>/g, "").replace(/;/g, "");
}

function contentKeyForMapKey(key: string) {
  return key.split("__")[0];
}

export function ThemeStyles({ content }: ThemeStylesProps) {
  const declarations = Object.entries(cssVarMap)
    .map(([key, variable]) => {
      const value = content[contentKeyForMapKey(key)]?.trim();
      return value ? `${variable}: ${escapeCssValue(value)};` : "";
    })
    .filter(Boolean)
    .join("\n");

  if (!declarations) return null;

  return (
    <style
      id="admin-theme-styles"
      dangerouslySetInnerHTML={{
        __html: `:root {\n${declarations}\n}`,
      }}
    />
  );
}
