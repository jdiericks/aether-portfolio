"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking-client";

interface GalleryItem {
  url: string;
  type?: "image" | "video";
  alt?: string;
}

interface ListingMediaGalleryProps {
  items: GalleryItem[];
  title: string;
  overlayContent?: ReactNode;
}

export function ListingMediaGallery({
  items,
  title,
  overlayContent,
}: ListingMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const currentItem = currentIndex !== null ? items[currentIndex] : null;

  const close = useCallback(() => {
    setCurrentIndex((index) => {
      if (index !== null) {
        window.setTimeout(() => triggerRefs.current[index]?.focus(), 0);
      }
      return null;
    });
  }, []);
  const previous = useCallback(() => {
    setCurrentIndex((index) => (index === null ? index : Math.max(0, index - 1)));
  }, []);
  const next = useCallback(() => {
    setCurrentIndex((index) =>
      index === null ? index : Math.min(items.length - 1, index + 1)
    );
  }, [items.length]);

  useEffect(() => {
    if (currentIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [close, currentIndex, next, previous]);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-muted text-muted-foreground md:min-h-[560px]">
        Listing media coming soon
      </div>
    );
  }

  const primary = items[0];
  const secondary = items.slice(1);

  return (
    <>
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <div className="relative min-h-[760px] w-full overflow-hidden bg-muted text-left md:min-h-[680px]">
          {primary.type === "video" ? (
            <video
              src={primary.url}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            <Image
              src={primary.url}
              alt={primary.alt || `${title} listing media`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 65vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          {primary.type === "video" && (
            <span className="absolute left-6 top-6 inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-sm font-medium md:left-10">
              <Play className="mr-2 h-4 w-4" />
              Video
            </span>
          )}
          <div className="absolute inset-0 overflow-y-auto p-6 md:inset-x-0 md:bottom-0 md:top-auto md:overflow-visible md:p-10">
            {overlayContent || (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-white/75">
                  Featured media
                </p>
                <p className="mt-2 max-w-3xl text-3xl font-light text-white md:text-5xl">
                  {title}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {secondary.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Gallery
            </p>
            <p className="text-sm text-muted-foreground">
              {secondary.length} item{secondary.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {secondary.map((item, index) => {
              const absoluteIndex = index + 1;
              return (
                <button
                  key={`${item.type}-${item.url}`}
                  ref={(node) => {
                    triggerRefs.current[absoluteIndex] = node;
                  }}
                  type="button"
                  aria-label={`Open ${item.type === "video" ? "video" : "image"} ${absoluteIndex + 1} of ${items.length} for ${title}`}
                  onClick={() => {
                    setCurrentIndex(absoluteIndex);
                    trackEvent("listing_gallery_open", {
                      listingTitle: title,
                      mediaType: item.type || "image",
                      index: absoluteIndex,
                    });
                  }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
                >
                  {item.type === "video" ? (
                    <>
                      <video
                        src={item.url}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        muted
                        playsInline
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                        <Play className="h-8 w-8" />
                      </span>
                    </>
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.alt || `${title} gallery image`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 20vw"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentItem && currentIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute left-4 top-4 z-10 text-sm text-white/70">
            {currentIndex + 1} / {items.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="absolute right-4 top-4 z-10 text-white hover:bg-white/20"
            aria-label="Close listing media viewer"
          >
            <X className="h-5 w-5" />
          </Button>
          <div
            className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
            onClick={close}
          >
            <div
              className="relative h-full w-full max-w-7xl"
              onClick={(event) => event.stopPropagation()}
            >
              {currentItem.type === "video" ? (
                <video
                  src={currentItem.url}
                  controls
                  autoPlay
                  onPlay={() =>
                    trackEvent("listing_video_play", {
                      listingTitle: title,
                      index: currentIndex,
                    })
                  }
                  className="h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={currentItem.url}
                  alt={currentItem.alt || `${title} listing media`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            className={cn(
              "absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 text-white hover:bg-white/20",
              currentIndex === 0 && "cursor-not-allowed opacity-50"
            )}
            disabled={currentIndex === 0}
            aria-label="Previous listing media"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className={cn(
              "absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 text-white hover:bg-white/20",
              currentIndex === items.length - 1 && "cursor-not-allowed opacity-50"
            )}
            disabled={currentIndex === items.length - 1}
            aria-label="Next listing media"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      )}
    </>
  );
}
