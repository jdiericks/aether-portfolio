"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { grantAnalyticsConsent } from "@/lib/tracking-client";

const CONSENT_KEY = "site_cookie_consent";

interface CookieConsentBannerProps {
  enabled?: boolean;
  message?: string;
  acceptLabel?: string;
  privacyUrl?: string;
}

export function CookieConsentBanner({
  enabled = true,
  message = "We use cookies and analytics to understand site activity and improve your experience.",
  acceptLabel = "Accept",
  privacyUrl = "/privacy",
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (!enabled || typeof window === "undefined") return false;
    return window.localStorage.getItem(CONSENT_KEY) !== "accepted";
  });

  if (!enabled || !isVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border bg-background/95 p-4 text-sm shadow-xl backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {message}{" "}
          <Link href={privacyUrl} className="text-foreground underline">
            Privacy Policy
          </Link>
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            window.localStorage.setItem(CONSENT_KEY, "accepted");
            grantAnalyticsConsent();
            setIsVisible(false);
          }}
        >
          {acceptLabel}
        </Button>
      </div>
    </div>
  );
}
