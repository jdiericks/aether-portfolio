"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackToTop() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed bottom-20 right-5 z-40 h-10 w-10 rounded-full bg-background/90 shadow-lg backdrop-blur"
      aria-label="Back to top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.body.focus?.();
      }}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
