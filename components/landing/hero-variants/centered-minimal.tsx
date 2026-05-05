import type { HeroData } from "./index";

export function CenteredMinimalHero(props: HeroData) {
  return (
    <section
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--theme-background) 0%, color-mix(in oklab, var(--theme-background) 92%, var(--theme-primary) 8%) 100%)",
        color: "var(--theme-foreground)",
      }}
    >
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center">
        {props.tagline && (
          <p
            className="mb-5 text-xs uppercase tracking-[0.3em] md:text-sm"
            style={{ color: "var(--theme-muted-foreground)" }}
          >
            {props.tagline}
          </p>
        )}
        <h1 className="mb-6 text-4xl font-light tracking-tight md:text-6xl">{props.title}</h1>
        {props.subtitle && (
          <p
            className="mx-auto mb-6 max-w-xl text-xl font-light md:text-2xl"
            style={{ color: "var(--theme-foreground)" }}
          >
            {props.subtitle}
          </p>
        )}
        {props.description && (
          <p
            className="mx-auto mb-10 max-w-2xl text-base md:text-lg"
            style={{ color: "var(--theme-muted-foreground)" }}
          >
            {props.description}
          </p>
        )}
        <a
          href={props.primaryHref}
          className="inline-flex h-12 items-center justify-center px-8 text-sm font-medium transition-opacity hover:opacity-90"
          style={{
            background: "var(--theme-primary)",
            color: "var(--theme-primary-foreground)",
            borderRadius: "var(--site-button-radius)",
          }}
        >
          {props.ctaPrimary}
        </a>
      </div>
    </section>
  );
}
