import {
  BarChart3,
  Bot,
  Code2,
  Gauge,
  HeartHandshake,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

interface IncludedFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DEFAULT_FEATURES: IncludedFeature[] = [
  {
    icon: Code2,
    title: "Modern Website",
    description:
      "Fast, accessible, mobile-first — built on Next.js with JSON-LD schema for maximum Google integration out of the box.",
  },
  {
    icon: MessagesSquare,
    title: "AI Content Management",
    description:
      "Update pages, publish blogs, and manage content by talking to your site.",
  },
  {
    icon: Sparkles,
    title: "Social Media Publishing",
    description:
      "Create and publish social posts about listings, blogs, or announcements — directly from the system.",
  },
  {
    icon: Search,
    title: "SEO Management",
    description:
      "Built-in SEO tools with analytics integration so you can see and act on what's working.",
  },
  {
    icon: Bot,
    title: "Structured Data",
    description:
      "JSON-LD schema on every page — the technical signal Google uses to understand and rank your content.",
  },
  {
    icon: ShieldCheck,
    title: "Accessibility Compliance",
    description:
      "Every site is built to WCAG 2.1 AA standards — good for users, required by law, rewarded by Google.",
  },
  {
    icon: Gauge,
    title: "Core Web Vitals Performance",
    description:
      "Fast load times, stable layouts, responsive interactions — the performance signals Google measures.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Light, built-in analytics so you're never flying blind.",
  },
  {
    icon: Users,
    title: "Team Access",
    description:
      "Configure users so your team or VA can manage the system too.",
  },
  {
    icon: HeartHandshake,
    title: "Ongoing Support",
    description:
      "Real support from the person who built it — not a ticket system.",
  },
];

interface IncludedSectionProps {
  label?: string;
  title?: string;
  description?: string;
  features?: IncludedFeature[];
}

export function IncludedSection({
  label = "What's Included",
  title = "Everything your business needs online. Nothing you don't.",
  description = "Aether ships as a complete system. Every feature below is included in the base plan.",
  features = DEFAULT_FEATURES,
}: IncludedSectionProps) {
  return (
    <section
      id="included"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-alt-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <h2 className="mb-4 text-3xl font-light tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-[var(--card-radius)] border bg-background p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-1.5 text-base font-medium">{feature.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
