import { Database, Gauge, ShieldCheck, type LucideIcon } from "lucide-react";

interface TechPillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TechPillarOverride {
  title?: string;
  description?: string;
}

interface TechCredibilitySectionProps {
  label?: string;
  title?: string;
  description?: string;
  pillarOverrides?: TechPillarOverride[];
}

const DEFAULT_PILLARS: TechPillar[] = [
  {
    icon: Database,
    title: "JSON-LD Structured Data",
    description:
      "Every page ships with schema markup that tells Google exactly what your business is, what you offer, and how to display it in search results. Most sites don't have this at all.",
  },
  {
    icon: ShieldCheck,
    title: "WCAG Accessibility",
    description:
      "Accessibility isn't just a legal requirement — it's a ranking signal. Every Aether site meets WCAG 2.1 AA standards out of the box.",
  },
  {
    icon: Gauge,
    title: "Core Web Vitals",
    description:
      "Google measures how fast and stable your site feels to real users. Aether sites are built on Next.js and optimized for top Core Web Vitals scores from day one.",
  },
];

export function TechCredibilitySection({
  label = "Built the way Google expects",
  title = "Not the way most agencies cut corners",
  description = "Most small business websites fail on Google before a single keyword even matters. The technical foundation is wrong. Pages aren't structured correctly. There's no schema data telling Google what the content means. Load times are too slow. Accessibility failures trigger ranking penalties. Every Aether site is built to avoid all of that by default.",
  pillarOverrides,
}: TechCredibilitySectionProps) {
  const resolvedPillars: TechPillar[] = DEFAULT_PILLARS.map((pillar, index) => {
    const override = pillarOverrides?.[index];
    return {
      ...pillar,
      title: override?.title || pillar.title,
      description: override?.description || pillar.description,
    };
  });

  return (
    <section
      id="tech-credibility"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <h2 className="mb-5 text-3xl font-light tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            {description}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {resolvedPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-[var(--card-radius)] border bg-background p-7 shadow-sm"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-lg font-medium">{pillar.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
