import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/schema-json-ld";
import { Button } from "@/components/ui/button";
import { getLocationPages, locationSlug, type LocationPage } from "@/lib/location-pages";
import { getSiteContent } from "@/lib/site-content";

interface LocationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LocationDetailPageProps) {
  const { slug } = await params;
  const [locations, content] = await Promise.all([getLocationPages(), getSiteContent()]);
  const location = locations.find((item) => item.slug === slug);

  if (!location) {
    return { title: "Location Not Found" };
  }

  return {
    title: `${location.name} Real Estate`,
    description: `Explore properties and real estate guidance for ${location.name} with ${content.brand_name} ${content.brand_subtitle}.`,
  };
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { slug } = await params;
  const [locations, content] = await Promise.all([getLocationPages(), getSiteContent()]);
  const location = locations.find((item) => item.slug === slug);

  if (!location) notFound();

  const baseUrl = (content.seo_site_url || "https://diericksrealty.com").replace(/\/$/, "");

  return (
    <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Place",
          name: location.name,
          url: `${baseUrl}/locations/${location.slug}`,
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: "Baja California",
          },
        }}
      />
      <Link href="/locations" className="text-sm text-muted-foreground hover:text-foreground">
        Back to locations
      </Link>
      <div className="mt-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Location guide</p>
        <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
          {location.name} Real Estate
        </h1>
        <p className="mt-4 text-muted-foreground">
          Browse current listings and market opportunities for {location.name}. Use this page as a local hub for available property pages in this area.
        </p>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-light">Available properties</h2>
          <Button asChild variant="outline">
            <Link href="/listings">All listings</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {location.listings?.map((listing) => (
            <article key={listing.slug} className="rounded-2xl border p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{listing.status}</p>
              <h3 className="mt-2 text-lg font-medium">
                <Link href={`/listings/${listing.slug}`} className="hover:underline">
                  {listing.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{listing.address}</p>
              <p className="mt-3 font-semibold">
                {listing.priceCurrency} {listing.price}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border bg-muted/30 p-6">
        <h2 className="text-xl font-medium">Nearby location pages</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {locations
            .filter((item) => item.slug !== location.slug)
            .slice(0, 8)
            .map((item) => (
              <Button key={item.slug} asChild variant="outline" size="sm">
                <Link href={`/locations/${item.slug}`}>{item.name}</Link>
              </Button>
            ))}
        </div>
      </section>
    </main>
  );
}

export async function generateStaticParams() {
  const locations = await getLocationPages();
  return locations.map((location: LocationPage) => ({
    slug: location.slug || locationSlug(location.name),
  }));
}
