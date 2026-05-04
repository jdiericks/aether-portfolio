import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingSectionProps {
  label?: string;
  title?: string;
  planName?: string;
  setupAmount?: string;
  setupLabel?: string;
  monthlyAmount?: string;
  monthlyLabel?: string;
  includesLabel?: string;
  includes?: string[];
  addonTitle?: string;
  addonDescription?: string;
  capacityNote?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function PricingSection({
  label = "Pricing",
  title = "Simple, transparent pricing",
  planName = "Aether Base",
  setupAmount = "$5,000",
  setupLabel = "one-time setup",
  monthlyAmount = "$350",
  monthlyLabel = "per month — hosting, maintenance, and support",
  includesLabel = "Includes everything in the features list — including:",
  includes = [],
  addonTitle = "Custom Add-ons",
  addonDescription = "Additional integrations and MCP features available based on your needs. Scoped and quoted separately.",
  capacityNote = "I take on a maximum of 10 clients at a time. This isn't a limitation — it's a commitment. Every client gets my full attention.",
  ctaLabel = "Get Your Free AI Readiness Audit",
  ctaHref = "#audit",
}: PricingSectionProps) {
  const includeItems = includes.filter(Boolean);

  return (
    <section
      id="pricing"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <h2 className="text-3xl font-light tracking-tight md:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[var(--card-radius)] border bg-background p-8 shadow-sm md:p-10">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {planName}
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-4xl font-light tracking-tight md:text-5xl">
                  {setupAmount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{setupLabel}</p>
              </div>
              <div>
                <p className="text-4xl font-light tracking-tight md:text-5xl">
                  {monthlyAmount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{monthlyLabel}</p>
              </div>
            </div>

            {includeItems.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <p className="mb-4 text-sm font-medium">{includesLabel}</p>
                <ul className="space-y-2.5">
                  {includeItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-foreground/90"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={ctaHref}>{ctaLabel}</a>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[var(--card-radius)] border bg-background p-6 shadow-sm">
              <h3 className="text-base font-medium">{addonTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {addonDescription}
              </p>
            </div>

            <div className="rounded-[var(--card-radius)] border bg-primary/5 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">
                Capacity
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground/90">
                {capacityNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
