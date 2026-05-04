import { AlertCircle } from "lucide-react";

interface ProblemSectionProps {
  label?: string;
  title?: string;
  items?: string[];
}

export function ProblemSection({
  label = "Sound familiar?",
  title = "You're a serious operator stuck running a website like it's 2014",
  items = [],
}: ProblemSectionProps) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <section
      id="problem"
      className="py-20 text-[var(--section-text)] md:py-28"
      style={{ background: "var(--section-alt-bg)" }}
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
        <ul className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-[var(--card-radius)] border bg-background p-5 shadow-sm"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p className="text-sm leading-6 text-foreground/90 md:text-base">
                {item}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
