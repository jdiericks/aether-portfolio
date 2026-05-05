import { ArrowRight } from "lucide-react";
import type { HeroData } from "./index";

export function SplitImageHero(props: HeroData) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "var(--theme-background)",
        color: "var(--theme-foreground)",
      }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
        <div>
          {props.tagline && (
            <p
              className="mb-4 text-xs uppercase tracking-[0.3em] md:text-sm"
              style={{ color: "var(--theme-muted-foreground)" }}
            >
              {props.tagline}
            </p>
          )}
          <h1 className="mb-6 text-4xl font-light tracking-tight md:text-5xl lg:text-6xl">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="mb-6 text-xl font-light md:text-2xl">{props.subtitle}</p>
          )}
          {props.description && (
            <p
              className="mb-10 max-w-lg text-base md:text-lg"
              style={{ color: "var(--theme-muted-foreground)" }}
            >
              {props.description}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={props.primaryHref}
              className="inline-flex h-11 items-center justify-center px-8 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: "var(--theme-primary)",
                color: "var(--theme-primary-foreground)",
                borderRadius: "var(--site-button-radius)",
              }}
            >
              {props.ctaPrimary}
            </a>
            {props.ctaSecondary && (
              <a
                href={props.secondaryHref}
                className="inline-flex h-11 items-center justify-center border px-8 text-sm font-medium transition-colors hover:bg-muted/40"
                style={{
                  borderColor: "var(--theme-border)",
                  borderRadius: "var(--site-button-radius)",
                  color: "var(--theme-foreground)",
                }}
              >
                {props.ctaSecondary} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden md:max-w-none">
          {props.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.heroImage}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div
              className="h-full w-full rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--theme-primary) 0%, color-mix(in oklab, var(--theme-primary) 60%, var(--theme-accent) 40%) 100%)",
              }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </section>
  );
}
