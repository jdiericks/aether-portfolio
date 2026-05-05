import { ArrowRight } from "lucide-react";
import type { HeroData } from "./index";

export function GradientCtaHero(props: HeroData) {
  return (
    <section
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden text-center"
      style={{
        background:
          "radial-gradient(ellipse at top, color-mix(in oklab, var(--theme-primary) 80%, var(--theme-accent) 20%) 0%, var(--theme-primary) 60%, color-mix(in oklab, var(--theme-primary) 75%, #000 25%) 100%)",
        color: "var(--theme-primary-foreground)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--theme-accent) 35%, transparent) 0%, transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in oklab, var(--theme-accent) 25%, transparent) 0%, transparent 50%)",
          opacity: 0.7,
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-24">
        {props.tagline && (
          <p
            className="mb-5 text-xs uppercase tracking-[0.4em] opacity-80 md:text-sm"
          >
            {props.tagline}
          </p>
        )}
        <h1 className="mb-6 text-5xl font-light tracking-tight md:text-7xl lg:text-8xl">
          {props.title}
        </h1>
        {props.subtitle && (
          <p className="mb-6 text-2xl font-light opacity-90 md:text-3xl">{props.subtitle}</p>
        )}
        {props.description && (
          <p className="mx-auto mb-12 max-w-xl text-base opacity-85 md:text-lg">
            {props.description}
          </p>
        )}
        <a
          href={props.primaryHref}
          className="inline-flex h-14 items-center justify-center px-10 text-base font-semibold shadow-2xl transition-transform hover:scale-[1.02]"
          style={{
            background: "var(--theme-background)",
            color: "var(--theme-foreground)",
            borderRadius: "var(--site-button-radius)",
          }}
        >
          {props.ctaPrimary} <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
