import Image from "next/image";
import {
  Award,
  CheckCircle2,
  Heart,
  Camera,
  MapPin,
  Clock,
  Star,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Camera,
  MapPin,
  Clock,
  Star,
  Award,
  Users,
  Sparkles,
};

interface AboutFeature {
  icon: string;
  title: string;
  description: string;
}

interface AboutSectionProps {
  label?: string;
  title?: string;
  description1?: string;
  description2?: string;
  features?: AboutFeature[];
  authorName?: string;
  authorTitle?: string;
  authorPhotoUrl?: string;
  credentials?: string[];
}

export function AboutSection({
  label = "Why I built this",
  title = "Built by someone who has actually shipped this work",
  description1 = "",
  description2 = "",
  features = [],
  authorName = "",
  authorTitle = "",
  authorPhotoUrl = "",
  credentials = [],
}: AboutSectionProps) {
  const credentialList = credentials.filter(Boolean);
  const featureList = features.filter((feature) => feature.title);

  return (
    <section
      id="about"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div className="space-y-6">
            {authorPhotoUrl ? (
              <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border bg-background shadow-sm">
                <Image
                  src={authorPhotoUrl}
                  alt={`${authorName} headshot`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] w-full max-w-sm items-center justify-center rounded-3xl border bg-muted p-6 text-center text-sm text-muted-foreground">
                Author photo coming soon — Google uses author identity as an
                E-E-A-T trust signal.
              </div>
            )}
            {(authorName || authorTitle) && (
              <div>
                {authorName && (
                  <p className="text-lg font-medium">{authorName}</p>
                )}
                {authorTitle && (
                  <p className="text-sm text-muted-foreground">{authorTitle}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <h2 className="mb-6 text-3xl font-light tracking-tight md:text-4xl">
              {title}
            </h2>
            {description1 && (
              <p className="mb-5 text-base leading-7 text-muted-foreground md:text-lg">
                {description1}
              </p>
            )}
            {description2 && (
              <p className="mb-6 text-base leading-7 text-muted-foreground md:text-lg">
                {description2}
              </p>
            )}

            {credentialList.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {credentialList.map((credential) => (
                  <div
                    key={credential}
                    className="flex items-start gap-2.5 rounded-[var(--card-radius)] border bg-background p-4 text-sm shadow-sm"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-foreground/90">{credential}</span>
                  </div>
                ))}
              </div>
            )}

            {featureList.length > 0 && (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {featureList.map((feature) => {
                  const Icon = iconMap[feature.icon] || Sparkles;
                  return (
                    <div
                      key={feature.title}
                      className="rounded-[var(--card-radius)] border bg-background p-5 shadow-sm"
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="mb-1 text-base font-medium">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
