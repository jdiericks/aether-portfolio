import { ArrowDown } from "lucide-react";
import type { HeroData } from "./index";

export function ClassicHero(props: HeroData) {
  const hasBackground = Boolean(props.backgroundImage);

  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-[var(--theme-hero-bg)] text-[var(--theme-hero-text)]">
      {hasBackground ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${props.backgroundImage}')` }}
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
        {props.tagline && (
          <p className="mb-4 text-xs tracking-[0.3em] uppercase opacity-80 md:text-sm">
            {props.tagline}
          </p>
        )}
        <h1 className="mb-6 text-5xl font-light tracking-tight md:text-7xl lg:text-8xl">
          {props.title}
        </h1>
        {props.subtitle && (
          <p className="mb-6 text-2xl font-light tracking-tight md:text-4xl">
            &ldquo;{props.subtitle}.&rdquo;
          </p>
        )}
        {props.description && (
          <p className="mx-auto mb-10 max-w-2xl text-base font-light text-[var(--theme-hero-muted)] md:text-lg">
            {props.description}
          </p>
        )}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={props.primaryHref}
            className="inline-flex h-11 items-center justify-center rounded-[var(--site-button-radius)] bg-[var(--theme-hero-button-bg)] px-8 text-sm font-medium text-[var(--theme-hero-button-text)] transition-opacity hover:opacity-90"
          >
            {props.ctaPrimary}
          </a>
          {props.ctaSecondary && (
            <a
              href={props.secondaryHref}
              className="inline-flex h-11 items-center justify-center rounded-[var(--site-button-radius)] border border-[var(--theme-hero-secondary-button-border)] bg-transparent px-8 text-sm font-medium transition-colors hover:bg-white/10"
            >
              {props.ctaSecondary} <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
