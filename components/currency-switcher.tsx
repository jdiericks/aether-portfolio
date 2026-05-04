"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  convertListingPrice,
  formatListingPriceAmount,
  resolveCurrencyRate,
  type ListingCurrency,
} from "@/lib/listing-currency";
import { trackEvent } from "@/lib/tracking-client";

interface CurrencySwitcherProps {
  amount: number | null;
  currency?: string | null;
  rate?: string | number | null;
  enabled?: boolean;
  defaultCurrency?: string | null;
  className?: string;
  valueClassName?: string;
}

function normalizeDisplayCurrency(
  defaultCurrency: string | null | undefined,
  listingCurrency: ListingCurrency
): ListingCurrency {
  if (defaultCurrency === "USD" || defaultCurrency === "MXN") {
    return defaultCurrency;
  }

  return listingCurrency;
}

export function CurrencySwitcher({
  amount,
  currency,
  rate,
  enabled = true,
  defaultCurrency,
  className,
  valueClassName,
}: CurrencySwitcherProps) {
  const listingCurrency: ListingCurrency = currency === "MXN" ? "MXN" : "USD";
  const [displayCurrency, setDisplayCurrency] = useState<ListingCurrency>(() =>
    normalizeDisplayCurrency(defaultCurrency, listingCurrency)
  );
  const exchangeRate = resolveCurrencyRate(String(rate ?? ""));
  const convertedAmount = useMemo(
    () =>
      amount
        ? convertListingPrice(
            amount,
            listingCurrency,
            displayCurrency,
            exchangeRate
          )
        : null,
    [amount, displayCurrency, exchangeRate, listingCurrency]
  );

  if (!amount || convertedAmount === null) {
    return <span className={cn("font-semibold", valueClassName)}>Price on request</span>;
  }

  const canSwitch = enabled && exchangeRate > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <p className={cn("font-semibold", valueClassName)}>
        {formatListingPriceAmount(convertedAmount, displayCurrency)}
      </p>
      {canSwitch && (
        <div className="inline-flex rounded-full border bg-background/80 p-1 shadow-sm">
          {(["USD", "MXN"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={displayCurrency === option ? "default" : "ghost"}
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => {
                setDisplayCurrency(option);
                trackEvent("property_price_toggle", {
                  fromCurrency: displayCurrency,
                  toCurrency: option,
                  listingCurrency,
                });
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
