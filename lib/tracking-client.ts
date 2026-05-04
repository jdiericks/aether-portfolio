"use client";

type TrackingProperties = Record<string, unknown>;

const CONSENT_KEY = "site_cookie_consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function hasConsent() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_KEY) === "accepted";
}

export function trackEvent(
  eventName: string,
  properties: TrackingProperties = {},
  options: { requireConsent?: boolean } = {}
) {
  if (typeof window === "undefined") return;
  if (options.requireConsent !== false && !hasConsent()) return;

  const payload = {
    eventName,
    path: window.location.pathname,
    referrer: document.referrer || null,
    properties,
  };

  window.gtag?.("event", eventName, properties);
  if (
    (eventName === "contact_form_submit" || eventName === "listing_inquiry_submit") &&
    typeof properties.googleAdsConversionTarget === "string"
  ) {
    window.gtag?.("event", "conversion", {
      send_to: properties.googleAdsConversionTarget,
    });
  }
  window.fbq?.("trackCustom", eventName, properties);
  window.dataLayer?.push({ event: eventName, ...properties });

  fetch("/api/tracking/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* Analytics should never interrupt the user experience. */
  });
}

export function grantAnalyticsConsent() {
  window.localStorage.setItem(CONSENT_KEY, "accepted");
  window.dispatchEvent(new Event("analytics-consent-change"));
}

export function denyAnalyticsConsent() {
  window.localStorage.setItem(CONSENT_KEY, "denied");
  window.dispatchEvent(new Event("analytics-consent-change"));
}

export function getAnalyticsConsent() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CONSENT_KEY);
}
