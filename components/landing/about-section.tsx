import {
  Heart,
  Camera,
  MapPin,
  Clock,
  Star,
  Award,
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

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface AboutSectionProps {
  label?: string;
  title?: string;
  description1?: string;
  description2?: string;
  features?: Feature[];
}

export function AboutSection({
  label = "About Us",
  title = "Real estate guidance with local insight and polished presentation",
  description1 = "We help buyers, sellers, and investors move with confidence through the Ensenada and Baja California real estate markets.",
  description2 = "From pricing and preparation to neighborhood tours and private property packages, our team combines market knowledge with clear communication at every step.",
  features = [
    {
      icon: "Heart",
      title: "Client-first advisory",
      description:
        "Every search, sale, and investment plan is shaped around your goals, timing, and budget.",
    },
    {
      icon: "Camera",
      title: "Listing presentation",
      description:
        "Professional media and curated property pages help homes make a stronger first impression online.",
    },
    {
      icon: "MapPin",
      title: "Local Expertise",
      description:
        "We know the coastal communities, wine country retreats, and city neighborhoods buyers ask about most.",
    },
    {
      icon: "Clock",
      title: "Private deal rooms",
      description:
        "Share disclosures, photos, and property documents securely with clients and qualified buyers.",
    },
  ],
}: AboutSectionProps) {
  return (
    <section
      id="about"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-alt-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
              {label}
            </p>
            <h2 className="text-3xl md:text-4xl font-light mb-6">{title}</h2>
            <p className="text-muted-foreground mb-6 text-lg">{description1}</p>
            <p className="text-muted-foreground text-lg">{description2}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = iconMap[feature.icon] || Heart;
              return (
                <div
                  key={feature.title}
                  className="rounded-[var(--card-radius)] border bg-background p-6 shadow-sm"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
