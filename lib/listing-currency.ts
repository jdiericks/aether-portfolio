export type ListingCurrency = "USD" | "MXN";

export function normalizeListingCurrency(
  currency: string | null | undefined
): ListingCurrency {
  return currency === "MXN" ? "MXN" : "USD";
}

export function parseListingPriceAmount(
  price: string,
  priceAmount?: number | null
) {
  if (typeof priceAmount === "number" && Number.isFinite(priceAmount) && priceAmount > 0) {
    return priceAmount;
  }

  const number = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function convertListingPrice(
  amount: number,
  sourceCurrency: ListingCurrency,
  targetCurrency: ListingCurrency,
  usdToMxnRate: number
) {
  if (sourceCurrency === targetCurrency) return amount;
  if (!Number.isFinite(usdToMxnRate) || usdToMxnRate <= 0) return amount;
  return sourceCurrency === "USD" ? amount * usdToMxnRate : amount / usdToMxnRate;
}

export function formatListingPriceAmount(
  amount: number,
  currency: ListingCurrency
) {
  return new Intl.NumberFormat(currency === "MXN" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function resolveCurrencyRate(value: string | null | undefined) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : 17.5;
}
