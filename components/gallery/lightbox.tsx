"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  filename: string;
}

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function Lightbox({
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: LightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrevious();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrevious, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentPhoto.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-4 left-4 z-10">
        <span className="text-white/70 text-sm">
          {currentIndex + 1} / {photos.length}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="text-white hover:bg-white/20"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
        onClick={onClose}
      >
        <div
          className="relative w-full h-full max-w-7xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.filename}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12",
          currentIndex === 0 && "opacity-50 cursor-not-allowed"
        )}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12",
          currentIndex === photos.length - 1 && "opacity-50 cursor-not-allowed"
        )}
        disabled={currentIndex === photos.length - 1}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
    </div>
  );
}
