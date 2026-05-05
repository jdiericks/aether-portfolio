"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Save,
  Image as ImageLucide,
  Palette,
  Globe,
  Sparkles,
  Type,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BlobUploadButton } from "@/components/admin/blob-upload-button";
import { cn } from "@/lib/utils";

type Branding = Record<string, string>;

const SECTIONS: {
  id: string;
  title: string;
  icon: typeof Globe;
  description: string;
}[] = [
  {
    id: "identity",
    title: "Brand identity",
    icon: Globe,
    description:
      "Your business name, logo, and favicon. These appear in the header, footer, browser tab, and every social share preview.",
  },
  {
    id: "colors",
    title: "Colors",
    icon: Palette,
    description:
      "The color tokens drive every button, link, surface, and accent on the public site.",
  },
  {
    id: "typography",
    title: "Voice",
    icon: Type,
    description: "Tagline and legal entity shown in the footer.",
  },
  {
    id: "whitelabel",
    title: "White-label",
    icon: Sparkles,
    description:
      "Show or hide the “Powered by” credit. Resellers can replace it with their own attribution or remove it entirely.",
  },
];

const COLOR_FIELDS: { key: string; label: string; description: string }[] = [
  { key: "theme_primary", label: "Primary", description: "Main brand color (buttons, links)" },
  { key: "theme_primary_foreground", label: "Primary text", description: "Text color on primary surfaces" },
  { key: "theme_accent", label: "Accent", description: "Hover and highlight tint" },
  { key: "theme_accent_foreground", label: "Accent text", description: "Text on accent surfaces" },
  { key: "theme_background", label: "Background", description: "Page background" },
  { key: "theme_foreground", label: "Foreground", description: "Default body text" },
];

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<Branding>({});
  const [original, setOriginal] = useState<Branding>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/branding");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load branding");
      setBranding(data.branding ?? {});
      setOriginal(data.branding ?? {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load branding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dirty = useMemo(() => {
    return Object.keys(branding).some((k) => branding[k] !== original[k]);
  }, [branding, original]);

  const update = (key: string, value: string) =>
    setBranding((prev) => ({ ...prev, [key]: value }));

  const updateBool = (key: string, value: boolean) =>
    update(key, value ? "true" : "false");

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setBranding(data.branding ?? branding);
      setOriginal(data.branding ?? branding);
      toast.success("Branding saved — public site will reflect the changes on next request.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showPoweredBy = (branding.branding_show_powered_by ?? "true") !== "false";
  const showHeaderText = (branding.brand_header_show_text ?? "true") !== "false";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> Branding
          </h1>
          <p className="text-muted-foreground">
            Make this site yours. Logo, favicon, brand name, colors, and footer credit — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
          )}
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <SectionCard section={SECTIONS[0]}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand name</Label>
                <Input
                  id="brand_name"
                  value={branding.brand_name ?? ""}
                  onChange={(e) => update("brand_name", e.target.value)}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_subtitle">Subtitle (optional)</Label>
                <Input
                  id="brand_subtitle"
                  value={branding.brand_subtitle ?? ""}
                  onChange={(e) => update("brand_subtitle", e.target.value)}
                  placeholder="e.g. Realty, Studio, Co"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload
                label="Logo"
                hint="Used in the header and footer. Transparent PNG or SVG works best."
                folder="branding"
                value={branding.brand_logo_url ?? ""}
                onChange={(url) => update("brand_logo_url", url)}
                previewClassName="h-16"
              />
              <ImageUpload
                label="Favicon"
                hint="Square icon shown in the browser tab. PNG, ICO, or SVG."
                folder="branding"
                accept="image/png, image/x-icon, image/svg+xml, image/vnd.microsoft.icon"
                value={branding.brand_favicon_url ?? ""}
                onChange={(url) => update("brand_favicon_url", url)}
                previewClassName="h-10 w-10"
              />
            </div>

            <Separator />

            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                id="brand_header_show_text"
                checked={showHeaderText}
                onCheckedChange={(v) => updateBool("brand_header_show_text", v)}
              />
              <Label htmlFor="brand_header_show_text" className="cursor-pointer">
                Show brand name next to the logo in the header
              </Label>
            </div>
          </SectionCard>

          {/* Colors */}
          <SectionCard section={SECTIONS[1]}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLOR_FIELDS.map((field) => (
                <ColorField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={branding[field.key] ?? ""}
                  onChange={(v) => update(field.key, v)}
                />
              ))}
            </div>
            <Separator />
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="theme_radius">Corner radius</Label>
              <Input
                id="theme_radius"
                value={branding.theme_radius ?? ""}
                onChange={(e) => update("theme_radius", e.target.value)}
                placeholder="0.625rem"
              />
              <p className="text-xs text-muted-foreground">
                Applied to buttons, cards, and inputs. Use any CSS length (e.g. <code>0.5rem</code>, <code>9999px</code>).
              </p>
            </div>
          </SectionCard>

          {/* Voice */}
          <SectionCard section={SECTIONS[2]}>
            <div className="space-y-2">
              <Label htmlFor="footer_tagline">Footer tagline</Label>
              <Input
                id="footer_tagline"
                value={branding.footer_tagline ?? ""}
                onChange={(e) => update("footer_tagline", e.target.value)}
                placeholder="One sentence about what you do"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_legal_entity">Legal entity</Label>
              <Input
                id="footer_legal_entity"
                value={branding.footer_legal_entity ?? ""}
                onChange={(e) => update("footer_legal_entity", e.target.value)}
                placeholder="e.g. Acme Realty LLC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_copyright">Copyright line (optional)</Label>
              <Input
                id="footer_copyright"
                value={branding.footer_copyright ?? ""}
                onChange={(e) => update("footer_copyright", e.target.value)}
                placeholder={`© ${new Date().getFullYear()} Your Brand. All rights reserved.`}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate from your brand name and the current year.
              </p>
            </div>
          </SectionCard>

          {/* White-label */}
          <SectionCard section={SECTIONS[3]}>
            <div className="space-y-2">
              <Label htmlFor="branding_product_name">Product name</Label>
              <Input
                id="branding_product_name"
                value={branding.branding_product_name ?? ""}
                onChange={(e) => update("branding_product_name", e.target.value)}
                placeholder="Aether"
              />
              <p className="text-xs text-muted-foreground">
                The name of the underlying platform — appears in the admin chrome and the
                default “Powered by” line. Resellers can change this to their own product name.
              </p>
            </div>

            <Separator />

            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                id="branding_show_powered_by"
                checked={showPoweredBy}
                onCheckedChange={(v) => updateBool("branding_show_powered_by", v)}
              />
              <Label htmlFor="branding_show_powered_by" className="cursor-pointer">
                Show “Powered by” credit in the public footer
              </Label>
            </div>

            {showPoweredBy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branding_powered_by_text">Credit text</Label>
                  <Input
                    id="branding_powered_by_text"
                    value={branding.branding_powered_by_text ?? ""}
                    onChange={(e) => update("branding_powered_by_text", e.target.value)}
                    placeholder="Powered by Aether"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branding_powered_by_url">Credit link</Label>
                  <Input
                    id="branding_powered_by_url"
                    type="url"
                    value={branding.branding_powered_by_url ?? ""}
                    onChange={(e) => update("branding_powered_by_url", e.target.value)}
                    placeholder="https://aether.systems"
                  />
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Live preview */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
              <CardDescription>How your branding looks across the site.</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandPreview branding={branding} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

function SectionCard({
  section,
  children,
}: {
  section: (typeof SECTIONS)[number];
  children: React.ReactNode;
}) {
  const Icon = section.icon;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5" /> {section.title}
        </CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Image uploader with preview + clear
// ---------------------------------------------------------------------------

function ImageUpload({
  label,
  hint,
  folder,
  accept,
  value,
  onChange,
  previewClassName,
}: {
  label: string;
  hint: string;
  folder: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
  previewClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-4">
        {value ? (
          <div className="flex items-center justify-center bg-[radial-gradient(circle,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[length:8px_8px] rounded-md p-3">
            {/* Use a plain <img> here so users can paste any URL (incl. external blob URLs)
                without configuring next/image domains. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className={cn("max-w-full object-contain", previewClassName)} />
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            <ImageLucide className="mr-2 h-4 w-4" />
            No {label.toLowerCase()} yet
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <BlobUploadButton
            folder={folder}
            accept={accept}
            label={value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
            onUploaded={(url) => onChange(url)}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
          )}
        </div>

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste a URL"
          className="text-xs"
        />
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color field with native picker + hex input
// ---------------------------------------------------------------------------

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const isHex = isHexColor(value);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex ? value.slice(0, 7) : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#171717 or rgb(...)"
          className="font-mono text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live preview — header, button, footer with powered-by line
// ---------------------------------------------------------------------------

function BrandPreview({ branding }: { branding: Branding }) {
  const brandName = branding.brand_name || "Your Brand";
  const brandSubtitle = branding.brand_subtitle || "";
  const showHeaderText = (branding.brand_header_show_text ?? "true") !== "false";
  const logoUrl = branding.brand_logo_url || "";
  const faviconUrl = branding.brand_favicon_url || "";
  const tagline = branding.footer_tagline || "Your tagline goes here.";
  const legalEntity = branding.footer_legal_entity || "";
  const copyright =
    branding.footer_copyright ||
    `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
  const showPoweredBy = (branding.branding_show_powered_by ?? "true") !== "false";
  const poweredByText =
    branding.branding_powered_by_text ||
    `Powered by ${branding.branding_product_name || "Aether"}`;
  const poweredByUrl = branding.branding_powered_by_url || "";

  const primary = branding.theme_primary || "#171717";
  const primaryFg = branding.theme_primary_foreground || "#ffffff";
  const accent = branding.theme_accent || "#f5f5f5";
  const background = branding.theme_background || "#ffffff";
  const foreground = branding.theme_foreground || "#171717";
  const radius = branding.theme_radius || "0.625rem";

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ background, color: foreground }}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-7 w-auto object-contain" />
          ) : faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faviconUrl} alt="" className="h-7 w-7 object-contain rounded" />
          ) : (
            <div
              className="h-7 w-7 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: primary, color: primaryFg }}
            >
              {brandName.charAt(0)}
            </div>
          )}
          {showHeaderText && (
            <span className="font-semibold truncate">
              {brandName}
              {brandSubtitle && (
                <span className="ml-1 text-xs uppercase tracking-widest opacity-70">
                  {brandSubtitle}
                </span>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          className="text-xs font-medium px-3 py-1.5"
          style={{
            background: primary,
            color: primaryFg,
            borderRadius: radius,
          }}
        >
          Get started
        </button>
      </div>

      {/* body — color swatches */}
      <div className="px-4 py-5 space-y-3 text-sm">
        <p>
          The quick brown fox jumps over <span style={{ color: primary, fontWeight: 600 }}>{brandName}</span>.
        </p>
        <div
          className="px-3 py-2 text-xs"
          style={{ background: accent, borderRadius: radius }}
        >
          Accent surface — used for hover states and highlights.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs font-medium px-3 py-1.5"
            style={{ background: primary, color: primaryFg, borderRadius: radius }}
          >
            Primary action
          </button>
          <button
            type="button"
            className="text-xs font-medium px-3 py-1.5 border"
            style={{ color: foreground, borderRadius: radius }}
          >
            Secondary
          </button>
        </div>
      </div>

      {/* footer */}
      <div
        className="border-t px-4 py-4 text-xs space-y-1"
        style={{ background: accent }}
      >
        <p className="font-semibold">{brandName}</p>
        {tagline && <p className="opacity-75">{tagline}</p>}
        <p className="opacity-60">{copyright}</p>
        {legalEntity && <p className="opacity-60">{legalEntity}</p>}
        {showPoweredBy && poweredByText && (
          <p className="opacity-50 pt-1 flex items-center gap-1">
            {poweredByUrl ? (
              <a
                href={poweredByUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1"
              >
                {poweredByText} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              poweredByText
            )}
          </p>
        )}
      </div>
    </div>
  );
}
