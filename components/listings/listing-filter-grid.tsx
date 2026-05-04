"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { parseListingPriceAmount } from "@/lib/listing-currency";

interface Listing {
  id: string;
  title: string;
  slug: string;
  address: string;
  city: string | null;
  state: string | null;
  neighborhood?: string | null;
  municipality?: string | null;
  price: string;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  lotSize?: string | null;
  status: string;
  description: string | null;
  imageUrl: string | null;
}

interface ListingFilterGridProps {
  listings: Listing[];
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

function listingSearchText(listing: Listing) {
  return [
    listing.title,
    listing.address,
    listing.city,
    listing.state,
    listing.neighborhood,
    listing.municipality,
    listing.status,
    listing.price,
    listing.description ? htmlToPlainText(listing.description) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function ListingFilterGrid({
  listings,
  currencyRate,
  currencySwitchEnabled = true,
  currencyDefaultDisplay,
}: ListingFilterGridProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const statusOptions = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.status).filter(Boolean))).sort(),
    [listings]
  );

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesStatus = status === "all" || listing.status === status;
      const matchesQuery =
        !normalizedQuery || listingSearchText(listing).includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [listings, query, status]);

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <h2 className="text-xl font-medium">No listings published yet</h2>
        <p className="mt-2 text-muted-foreground">
          Check back soon for newly published homes and investment opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="space-y-2">
            <label htmlFor="listing-search" className="text-sm font-medium">
              Search properties
            </label>
            <Input
              id="listing-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, city, neighborhood, address, or feature"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="listing-status-filter" className="text-sm font-medium">
              Filter by status
            </label>
            <select
              id="listing-status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          Showing {filteredListings.length} of {listings.length} properties.
        </p>
      </div>

      {filteredListings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h2 className="text-xl font-medium">No properties match your filters</h2>
          <p className="mt-2 text-muted-foreground">
            Try a different search term or status.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <article
              key={listing.id}
              className="overflow-hidden rounded-xl border bg-background shadow-sm"
            >
              <Link href={`/listings/${listing.slug}`}>
                <div className="relative aspect-[4/3] bg-muted">
                  {listing.imageUrl ? (
                    <Image
                      src={listing.imageUrl}
                      alt={`${listing.title} listing photo`}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Listing image coming soon
                    </div>
                  )}
                  <Badge className="absolute left-4 top-4 capitalize">
                    {listing.status}
                  </Badge>
                </div>
              </Link>
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")}
                  </p>
                  <h2 className="mt-1 text-xl font-medium">
                    <Link href={`/listings/${listing.slug}`} className="hover:underline">
                      {listing.title}
                    </Link>
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">{formatSpecs(listing)}</p>
                {listing.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {htmlToPlainText(listing.description)}
                  </p>
                )}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <CurrencySwitcher
                    amount={parseListingPriceAmount(listing.price, listing.priceAmount)}
                    currency={listing.priceCurrency}
                    rate={currencyRate}
                    enabled={currencySwitchEnabled}
                    defaultCurrency={currencyDefaultDisplay}
                    valueClassName="text-lg"
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/listings/${listing.slug}`}>View details</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
