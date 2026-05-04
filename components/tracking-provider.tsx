"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracking-client";

interface TrackingProviderProps {
  context?: Record<string, unknown>;
}

export function TrackingProvider({ context }: TrackingProviderProps) {
  const pathname = usePathname();
  const startedAt = useRef<number | null>(null);
  const previousPath = useRef<string | null>(null);
  const contextRef = useRef<Record<string, unknown> | undefined>(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    const currentPath = pathname || "/";
    if (previousPath.current && startedAt.current !== null) {
      const durationMs = Date.now() - startedAt.current;
      trackEvent(
        "page_engagement",
        { durationMs, ...contextRef.current },
        { requireConsent: false }
      );
    }

    previousPath.current = currentPath;
    startedAt.current = Date.now();
    trackEvent("page_view", contextRef.current, { requireConsent: false });

    return () => {
      if (startedAt.current === null) return;
      const durationMs = Date.now() - startedAt.current;
      trackEvent(
        "page_engagement",
        { durationMs, ...contextRef.current },
        { requireConsent: false }
      );
    };
  }, [pathname]);

  return null;
}
