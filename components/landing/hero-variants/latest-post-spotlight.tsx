import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroData } from "./index";

export function LatestPostSpotlightHero(props: HeroData) {
  const post = props.showLatestPost ? props.latestPost : null;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--theme-background) 96%, var(--theme-primary) 4%) 0%, var(--theme-background) 100%)",
        color: "var(--theme-foreground)",
      }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-[1.1fr_1fr] md:py-28">
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
          {props.description && (
            <p
              className="mb-8 max-w-xl text-base md:text-lg"
              style={{ color: "var(--theme-muted-foreground)" }}
            >
              {props.description}
            </p>
          )}
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
        </div>

        {post ? (
          <Link
            href={`/insights/${post.slug}`}
            className="group block rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md md:p-8"
            style={{ borderColor: "var(--theme-border)" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--theme-primary)" }}
            >
              {props.latestPostLabel}
            </span>
            {post.category && (
              <p
                className="mt-3 text-xs uppercase tracking-widest"
                style={{ color: "var(--theme-muted-foreground)" }}
              >
                {post.category}
              </p>
            )}
            <h2 className="mt-2 text-2xl font-light tracking-tight md:text-3xl">
              {post.title}
            </h2>
            {post.excerpt && (
              <p
                className="mt-4 line-clamp-3 text-sm md:text-base"
                style={{ color: "var(--theme-muted-foreground)" }}
              >
                {post.excerpt}
              </p>
            )}
            <p
              className="mt-6 inline-flex items-center text-sm font-medium transition-transform group-hover:translate-x-0.5"
              style={{ color: "var(--theme-primary)" }}
            >
              {props.latestPostCta} <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </p>
          </Link>
        ) : (
          <div
            className="rounded-2xl border border-dashed p-8 text-sm"
            style={{
              borderColor: "var(--theme-border)",
              color: "var(--theme-muted-foreground)",
            }}
          >
            Publish your first blog post and it will appear here as a featured spotlight.
          </div>
        )}
      </div>
    </section>
  );
}
