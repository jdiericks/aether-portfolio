import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

interface FooterProps {
  brandName?: string;
  brandSubtitle?: string;
  tagline?: string;
  legalEntity?: string;
  logoUrl?: string;
  description?: string;
  location?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  whatsappUrl?: string;
  copyrightText?: string;
  privacyHref?: string;
  privacyUrl?: string;
  showPrivacyLink?: boolean;
  termsHref?: string;
  termsUrl?: string;
  showTermsLink?: boolean;
  sitemapHref?: string;
  sitemapUrl?: string;
  showSitemapLink?: boolean;
  accessibilityUrl?: string;
  showAccessibilityLink?: boolean;
}

export function Footer({
  brandName = "Aether",
  brandSubtitle = "",
  tagline = "",
  legalEntity = "",
  logoUrl = "",
  description = "",
  location = "",
  instagramUrl = "",
  facebookUrl = "",
  tiktokUrl = "",
  youtubeUrl = "",
  linkedinUrl = "",
  xUrl = "",
  whatsappUrl = "",
  copyrightText = "",
  privacyHref = "/privacy",
  privacyUrl,
  showPrivacyLink = true,
  termsHref = "/terms",
  termsUrl,
  showTermsLink = true,
  sitemapHref = "/site-map",
  sitemapUrl,
  showSitemapLink = true,
  accessibilityUrl = "/accessibility",
  showAccessibilityLink = true,
}: FooterProps) {
  const privacyLink = privacyUrl || privacyHref;
  const termsLink = termsUrl || termsHref;
  const sitemapLink = sitemapUrl || sitemapHref;
  const socialLinks = [
    instagramUrl ? { icon: Instagram, href: instagramUrl, label: "Visit Instagram profile" } : null,
    facebookUrl ? { icon: Facebook, href: facebookUrl, label: "Visit Facebook page" } : null,
    tiktokUrl ? { icon: Music2, href: tiktokUrl, label: "Visit TikTok profile" } : null,
    youtubeUrl ? { icon: Youtube, href: youtubeUrl, label: "Visit YouTube channel" } : null,
    linkedinUrl ? { icon: Linkedin, href: linkedinUrl, label: "Visit LinkedIn page" } : null,
    xUrl ? { icon: Twitter, href: xUrl, label: "Visit X profile" } : null,
    whatsappUrl ? { icon: MessageCircle, href: whatsappUrl, label: "Open WhatsApp chat" } : null,
  ].filter(Boolean) as { icon: LucideIcon; href: string; label: string }[];

  return (
    <footer
      id="site-footer"
      tabIndex={-1}
      className="border-t"
      style={{
        background: "var(--site-footer-bg)",
        color: "var(--site-footer-fg)",
        borderColor: "var(--site-footer-border)",
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              {logoUrl ? (
                <>
                  <Image
                    src={logoUrl}
                    alt={`${brandName} logo`}
                    width={120}
                    height={40}
                    className="max-h-10 w-auto object-contain"
                  />
                  <span className="sr-only">
                    {brandName} {brandSubtitle}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-lg">{brandName}</span>
                  <span
                    className="text-sm tracking-widest uppercase"
                    style={{ color: "var(--site-footer-muted-fg)" }}
                  >
                    {brandSubtitle}
                  </span>
                </>
              )}
            </div>
            {tagline && (
              <p
                className="mt-3 max-w-md text-sm font-medium"
                style={{ color: "var(--site-footer-fg)" }}
              >
                {tagline}
              </p>
            )}
            {description && (
              <p
                className="mt-3 max-w-md text-sm"
                style={{ color: "var(--site-footer-muted-fg)" }}
              >
                {description}
              </p>
            )}
            {location && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--site-footer-muted-fg)" }}
              >
                {location}
              </p>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link flex items-center justify-center transition-colors"
                    style={{
                      width: "var(--site-footer-social-size)",
                      height: "var(--site-footer-social-size)",
                      borderRadius: "var(--site-footer-social-radius)",
                      background: "var(--site-footer-social-bg)",
                      color: "var(--site-footer-social-fg)",
                    }}
                    aria-label={social.label}
                  >
                    <Icon
                      style={{
                        width: "var(--site-footer-social-icon-size)",
                        height: "var(--site-footer-social-icon-size)",
                      }}
                    />
                  </a>
                );
              })}
            </div>
          )}

          <div
            className="space-y-2 text-sm text-center md:text-right"
            style={{ color: "var(--site-footer-muted-fg)" }}
          >
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 md:justify-end">
              {showPrivacyLink && (
                <Link href={privacyLink} className="hover:opacity-80">
                  Privacy Policy
                </Link>
              )}
              {showTermsLink && (
                <Link href={termsLink} className="hover:opacity-80">
                  Terms of Service
                </Link>
              )}
              {showSitemapLink && (
                <Link href={sitemapLink} className="hover:opacity-80">
                  Sitemap
                </Link>
              )}
              {showAccessibilityLink && (
                <Link href={accessibilityUrl} className="hover:opacity-80">
                  Accessibility
                </Link>
              )}
            </div>
            <p>
              {copyrightText ||
                `© ${new Date().getFullYear()} ${brandName}${
                  brandSubtitle ? ` ${brandSubtitle}` : ""
                }. All rights reserved.`}
            </p>
            {legalEntity && <p>{legalEntity}</p>}
          </div>
        </div>
      </div>
    </footer>
  );
}
