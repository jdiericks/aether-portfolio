"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/#work", label: "Work" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/insights", label: "Blog" },
  { href: "/#about", label: "About" },
  { href: "/#audit", label: "Free Audit" },
];

interface NavbarProps {
  brandName?: string;
  brandSubtitle?: string;
  logoUrl?: string;
  logoWidth?: string;
  logoHeight?: string;
  logoBackground?: string;
  showBrandText?: boolean;
  solid?: boolean;
}

export function Navbar({
  brandName = "Diericks",
  brandSubtitle = "Real Estate",
  logoUrl = "",
  logoWidth = "40",
  logoHeight = "40",
  logoBackground = "rgba(255, 255, 255, 0.8)",
  showBrandText = true,
  solid = false,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isSolid = solid || isScrolled;

  useEffect(() => {
    if (solid) {
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [solid]);

  const parsedLogoWidth = Number(logoWidth);
  const parsedLogoHeight = Number(logoHeight);
  const logoBoxWidth =
    Number.isFinite(parsedLogoWidth) && parsedLogoWidth > 0 ? parsedLogoWidth : 40;
  const logoBoxHeight =
    Number.isFinite(parsedLogoHeight) && parsedLogoHeight > 0 ? parsedLogoHeight : 40;
  const headerTextColor = isSolid
    ? "var(--site-header-scrolled-fg)"
    : "var(--site-header-transparent-fg)";
  const mutedHeaderTextColor = isSolid
    ? "color-mix(in oklab, var(--site-header-scrolled-fg) 70%, transparent)"
    : "var(--site-header-transparent-fg)";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isSolid
          ? "border-b shadow-sm backdrop-blur"
          : "backdrop-blur-none"
      )}
      style={{
        backgroundColor: isSolid
          ? "var(--site-header-scrolled-bg)"
          : "var(--site-header-transparent-bg)",
        color: headerTextColor,
        borderColor: isSolid ? "var(--site-header-border)" : "transparent",
      }}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl && (
            <span
              className="relative block shrink-0 overflow-hidden"
              style={{
                width: logoBoxWidth,
                height: logoBoxHeight,
                backgroundColor: logoBackground || "transparent",
                borderRadius: "var(--site-logo-radius)",
                padding: "var(--site-logo-padding)",
              }}
            >
              <Image
                src={logoUrl}
                alt={`${brandName} logo`}
                fill
                className="object-contain"
                sizes={`${logoBoxWidth}px`}
              />
            </span>
          )}
          {(showBrandText || !logoUrl) && (
            <>
              <span
                className="font-semibold text-xl tracking-wide"
                style={{ color: headerTextColor }}
              >
                {brandName}
              </span>
              {brandSubtitle && (
                <span
                  className="text-sm font-light tracking-widest uppercase"
                  style={{
                    color: mutedHeaderTextColor,
                    opacity: isSolid ? 1 : 0.82,
                  }}
                >
                  {brandSubtitle}
                </span>
              )}
            </>
          )}
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                !isSolid && "hover:opacity-80"
              )}
              style={{ color: headerTextColor }}
            >
              {link.label}
            </a>
          ))}
          <Button asChild variant={isSolid ? "default" : "secondary"}>
            <Link href="/#audit">Free Audit</Link>
          </Button>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu
                className="h-6 w-6"
                style={{ color: headerTextColor }}
              />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] p-0">
            <div className="flex h-full flex-col">
              <div className="border-b px-6 py-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Menu
                </p>
                <p className="mt-1 font-semibold">
                  {brandName}
                  {brandSubtitle ? ` ${brandSubtitle}` : ""}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-2 px-4 py-6">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="border-t px-4 py-4">
                <Button asChild className="w-full">
                  <Link href="/#audit" onClick={() => setIsOpen(false)}>
                    Free Audit
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
