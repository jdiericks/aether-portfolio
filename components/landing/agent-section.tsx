import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentSectionProps {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  whatsappUrl?: string;
  photoUrl?: string;
  bio?: string;
  specialties?: string | string[];
  serviceAreas?: string | string[];
}

function splitList(value?: string | string[]) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function bioExcerpt(value: string, fallback: string) {
  const plainText = (value || fallback)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return plainText.length > 260 ? `${plainText.slice(0, 257).trim()}...` : plainText;
}

export function AgentSection({
  name = "Real Estate Advisor",
  title = "Real Estate Advisor",
  email = "",
  phone = "",
  whatsappUrl = "",
  photoUrl = "",
  bio = "",
  specialties = "",
  serviceAreas = "",
}: AgentSectionProps) {
  const specialtyList = splitList(specialties);
  const areaList = splitList(serviceAreas);
  const excerpt = bioExcerpt(
    bio ||
      "",
    `${name} provides local real estate guidance for buyers, sellers, and investors.`
  );

  return (
    <section className="border-t bg-muted/20 px-4 py-20 md:py-28">
      <div className="container mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.65fr_0.35fr] md:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Meet your advisor
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-tight md:text-5xl">
            {name}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{title}</p>
          <p className="mt-6 max-w-2xl leading-8 text-muted-foreground">
            {excerpt}
          </p>

          {specialtyList.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {specialtyList.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
          {areaList.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Serving {areaList.join(", ")}.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <a href="#contact">Start a conversation</a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/agents/eric-becerra">Read agent bio</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {email && (
              <a className="inline-flex items-center gap-2 hover:text-foreground" href={`mailto:${email}`}>
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {phone && (
              <a className="inline-flex items-center gap-2 hover:text-foreground" href={`tel:${phone}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
            {whatsappUrl && (
              <a
                className="inline-flex items-center gap-2 hover:text-foreground"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-background">
          {photoUrl ? (
            <div className="relative aspect-[4/5]">
              <Image
                src={photoUrl}
                alt={`${name} headshot`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center bg-muted p-8 text-center text-muted-foreground">
              Agent photo coming soon
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
