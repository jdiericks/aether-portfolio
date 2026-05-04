import { Check } from "lucide-react";

interface SolutionSectionProps {
  label?: string;
  title?: string;
  description1?: string;
  description2?: string;
  points?: string[];
}

export function SolutionSection({
  label = "The Aether System",
  title = "One system. One conversation. Everything handled.",
  description1 = "",
  description2 = "",
  points = [],
}: SolutionSectionProps) {
  const filtered = points.filter(Boolean);

  return (
    <section
      id="solution"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <h2 className="mb-6 text-3xl font-light tracking-tight md:text-4xl">
              {title}
            </h2>
            {description1 && (
              <p className="mb-5 text-lg leading-8 text-muted-foreground">
                {description1}
              </p>
            )}
            {description2 && (
              <p className="text-lg leading-8 text-muted-foreground">
                {description2}
              </p>
            )}
          </div>

          {filtered.length > 0 && (
            <ul className="space-y-4">
              {filtered.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-[var(--card-radius)] border bg-background p-5 shadow-sm"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  </span>
                  <p className="text-base leading-6 text-foreground/90">
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
