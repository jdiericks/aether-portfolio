"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  backgroundImage?: string;
  tagline?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  primaryHref?: string;
  secondaryHref?: string;
}

export function HeroSection({
  backgroundImage = "",
  tagline = "AI-Powered Business Systems",
  title = "Aether",
  subtitle = "Run your business by talking to it",
  description = "Aether is an AI-powered business system that manages your website, content, social media, and SEO — all through conversation. Built on the technical foundations Google actually rewards.",
  ctaPrimary = "Get Your Free AI Readiness Audit",
  ctaSecondary = "See how it works",
  primaryHref = "#audit",
  secondaryHref = "#solution",
}: HeroSectionProps) {
  const scrollToSecondary = () => {
    const target = secondaryHref.replace(/^#/, "");
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  };

  const hasBackground = Boolean(backgroundImage);

  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-[var(--theme-hero-bg)] text-[var(--theme-hero-text)]">
      {hasBackground ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        >
          <div className="absolute inset-0 bg-[var(--theme-hero-overlay)]" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top, color-mix(in oklab, var(--theme-hero-button-bg) 18%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--theme-hero-bg) 0%, color-mix(in oklab, var(--theme-hero-bg) 80%, var(--theme-hero-text) 6%) 100%)",
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <p className="mb-4 text-xs tracking-[0.3em] uppercase opacity-80 md:text-sm">
          {tagline}
        </p>
        <h1 className="mb-6 text-5xl font-light tracking-tight md:text-7xl lg:text-8xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mb-6 text-2xl font-light tracking-tight md:text-4xl">
            &ldquo;{subtitle}.&rdquo;
          </p>
        )}
        <p className="mx-auto mb-10 max-w-2xl text-base font-light text-[var(--theme-hero-muted)] md:text-lg">
          {description}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-[var(--theme-hero-button-bg)] text-[var(--theme-hero-button-text)] hover:opacity-90"
          >
            <a href={primaryHref}>{ctaPrimary}</a>
          </Button>
          <a
            href={secondaryHref}
            onClick={(event) => {
              if (secondaryHref.startsWith("#")) {
                event.preventDefault();
                scrollToSecondary();
              }
            }}
            className="inline-flex h-11 items-center justify-center rounded-[var(--site-button-radius)] border border-[var(--theme-hero-secondary-button-border)] bg-transparent px-8 text-sm font-medium transition-colors hover:bg-white/10"
          >
            {ctaSecondary} <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <button
        onClick={scrollToSecondary}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        aria-label={`Scroll to ${secondaryHref.replace(/^#/, "")}`}
      >
        <ArrowDown className="h-8 w-8" />
      </button>
    </section>
  );
}
