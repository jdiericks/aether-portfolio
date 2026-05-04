import Image from "next/image";
import { CheckCircle2, ExternalLink } from "lucide-react";

export interface ProofDeployment {
  name: string;
  industry: string;
  description: string;
  url?: string;
  screenshotUrl?: string;
  metrics?: { label: string; value: string }[];
}

interface ProofSectionProps {
  label?: string;
  title?: string;
  description?: string;
  deployments?: ProofDeployment[];
}

const DEFAULT_DEPLOYMENTS: ProofDeployment[] = [
  {
    name: "Photography Portfolio",
    industry: "Creative & Photography",
    description:
      "A modern, AI-managed portfolio site for a photography business. Manages content, gallery, and SEO through conversation. Built with full JSON-LD schema and WCAG accessibility compliance.",
    url: "",
    screenshotUrl: "",
    metrics: [
      { label: "PageSpeed", value: "Coming soon" },
      { label: "Structured data", value: "Validated" },
      { label: "Accessibility", value: "WCAG 2.1 AA" },
    ],
  },
  {
    name: "Real Estate Business",
    industry: "Real Estate",
    description:
      "A full AI-managed business site for a real estate company. Manages property listings, blog content, social media publishing, and SEO — all operated through a conversational AI interface. Every listing is structured with JSON-LD for maximum Google visibility.",
    url: "",
    screenshotUrl: "",
    metrics: [
      { label: "PageSpeed", value: "Coming soon" },
      { label: "Structured data", value: "Validated" },
      { label: "Accessibility", value: "WCAG 2.1 AA" },
    ],
  },
];

export function ProofSection({
  label = "Aether in the wild",
  title = "Real deployments. Real results.",
  description = "Every site is built and run by the same person who built Aether. No outsourced builds, no white-label resellers — just real production deployments.",
  deployments = DEFAULT_DEPLOYMENTS,
}: ProofSectionProps) {
  return (
    <section
      id="work"
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

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {deployments.map((deployment) => (
            <article
              key={deployment.name}
              className="overflow-hidden rounded-[var(--card-radius)] border bg-background shadow-sm"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {deployment.screenshotUrl ? (
                  <Image
                    src={deployment.screenshotUrl}
                    alt={`${deployment.name} screenshot`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Screenshot coming soon
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                  {deployment.industry}
                </span>
              </div>
              <div className="space-y-4 p-6">
                <h3 className="text-xl font-medium">{deployment.name}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {deployment.description}
                </p>

                {deployment.metrics && deployment.metrics.length > 0 && (
                  <ul className="grid grid-cols-3 gap-3 border-t pt-4">
                    {deployment.metrics.map((metric) => (
                      <li key={metric.label} className="text-center">
                        <p className="flex items-center justify-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          {metric.label}
                        </p>
                        <p className="mt-1 text-sm font-medium">{metric.value}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {deployment.url && (
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View live site
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
