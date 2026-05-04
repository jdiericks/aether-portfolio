"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { Languages, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage?: string;
            includedLanguages?: string;
            layout?: unknown;
            autoDisplay?: boolean;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

interface GoogleTranslateWidgetProps {
  enabled?: boolean;
  languages?: string;
  label?: string;
}

export function GoogleTranslateWidget({
  enabled = true,
  languages = "en,es",
  label = "Translate",
}: GoogleTranslateWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isPrivateArea =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname === "/login";

  useEffect(() => {
    if (!enabled || isPrivateArea) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: languages || "en,es",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, [enabled, isPrivateArea, languages]);

  if (!enabled || isPrivateArea) return null;

  return (
    <div className="notranslate fixed bottom-5 left-5 z-40 print:hidden">
      <div
        className={cn(
          "mb-3 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border bg-background/95 p-4 text-foreground shadow-xl backdrop-blur transition-all duration-200",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4" />
              {label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a language for this page.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setIsOpen(false)}
            aria-label="Close translation menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div id="google_translate_element" className="translation-select text-sm" />
      </div>

      <Button
        type="button"
        size="icon"
        className="h-11 w-11 rounded-full shadow-lg"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close translation menu" : "Open translation menu"}
        aria-expanded={isOpen}
      >
        <Languages className="h-5 w-5" />
      </Button>

      <span className="sr-only">{label}</span>

      <style jsx global>{`
        .translation-select .goog-te-gadget {
          color: hsl(var(--muted-foreground));
          font-family: inherit;
          font-size: 0;
        }

        .translation-select .goog-te-combo {
          margin: 0;
          width: 100%;
          min-height: 2.5rem;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          padding: 0 0.75rem;
          font: inherit;
          font-size: 0.875rem;
        }

        .translation-select span,
        .translation-select img {
          display: none;
        }

        body {
          top: 0 !important;
        }

        body.translated-ltr,
        body.translated-rtl {
          top: 0 !important;
        }

        .skiptranslate iframe,
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
          height: 0 !important;
          visibility: hidden !important;
        }
      `}</style>

      <Script
        id="google-translate"
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </div>
  );
}
