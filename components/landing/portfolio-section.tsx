"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lightbox } from "@/components/gallery/lightbox";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { parseListingPriceAmount } from "@/lib/listing-currency";
import { Button } from "@/components/ui/button";

interface PortfolioPhoto {
  id: string;
  url: string;
  caption: string | null;
  filename: string;
}

interface Listing {
  id: string;
  title: string;
  slug: string;
  address: string;
  city: string | null;
  state?: string | null;
  price: string;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  description: string | null;
  imageUrl: string | null;
  status: string;
}

interface PortfolioSectionProps {
  photos: PortfolioPhoto[];
  listings?: Listing[];
  currencyRate?: string;
  currencySwitchEnabled?: boolean;
  currencyDefaultDisplay?: string;
}

function formatSpecs(listing: Listing) {
  const specs = [
    listing.beds !== null ? `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` : null,
    listing.baths !== null ? `${listing.baths} bath${listing.baths === 1 ? "" : "s"}` : null,
    listing.squareFeet !== null ? `${listing.squareFeet.toLocaleString()} sq ft` : null,
  ].filter(Boolean);

  return specs.length > 0 ? specs.join(" / ") : "Details available on request";
}

function htmlToPlainText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function PortfolioSection({
  photos,
  listings = [],
  currencyRate,
  currencySwitchEnabled = true,
  currencyDefaultDisplay,
}: PortfolioSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxPhotos = photos.map((p) => ({
    id: p.id,
    url: p.url,
    filename: p.caption || p.filename,
  }));

  return (
    <section
      id="portfolio"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Featured Homes
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-4">
            Properties Worth Touring
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A curated look at standout listings, neighborhood favorites, and
            polished property presentations for buyers and sellers.
          </p>
          <Button asChild className="mt-6">
            <Link href="/listings">View all listings</Link>
          </Button>
        </div>

        {listings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden border bg-background shadow-sm"
                style={{ borderRadius: "var(--card-radius)" }}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {listing.imageUrl ? (
                    <Image
                      src={listing.imageUrl}
                      alt={`${listing.title} listing photo`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Listing image coming soon
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                    {listing.status}
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")}
                    </p>
                    <h3 className="mt-1 text-xl font-medium">{listing.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatSpecs(listing)}
                  </p>
                  {listing.description && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {htmlToPlainText(listing.description)}
                    </p>
                  )}
                  {listing.price && (
                    <CurrencySwitcher
                      amount={parseListingPriceAmount(
                        listing.price,
                        listing.priceAmount
                      )}
                      currency={listing.priceCurrency}
                      rate={currencyRate}
                      enabled={currencySwitchEnabled}
                      defaultCurrency={currencyDefaultDisplay}
                      valueClassName="text-lg"
                    />
                  )}
                  <Link
                    href={`/listings/${listing.slug}`}
                    className="inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    View listing details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Listings coming soon. Check back to see our latest properties!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || "Listing photo"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrevious={() =>
            setLightboxIndex((prev) => Math.max(0, (prev || 0) - 1))
          }
          onNext={() =>
            setLightboxIndex((prev) =>
              Math.min(photos.length - 1, (prev || 0) + 1)
            )
          }
        />
      )}
    </section>
  );
}
