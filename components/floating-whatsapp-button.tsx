"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/tracking-client";

interface FloatingWhatsAppButtonProps {
  href?: string;
  label?: string;
}

export function FloatingWhatsAppButton({
  href,
  label = "Chat on WhatsApp",
}: FloatingWhatsAppButtonProps) {
  const pathname = usePathname();
  if (!href) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600"
      aria-label={label}
      title={label}
      onClick={() =>
        trackEvent("whatsapp_click", {
          href,
          location: "floating_button",
        })
      }
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
