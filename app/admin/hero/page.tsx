"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Save,
  Sparkles,
  LayoutTemplate,
  CheckCircle2,
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
import {
  HERO_VARIANTS,
  type HeroVariantId,
  isHeroVariantId,
  HeroDispatcher,
  type HeroData,
} from "@/components/landing/hero-variants";

type HeroSettings = Record<string, string>;

export default function HeroPage() {
  const [hero, setHero] = useState<HeroSettings>({});
  const [original, setOriginal] = useState<HeroSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hero");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hero settings");
      setHero(data.hero ?? {});
      setOriginal(data.hero ?? {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load hero settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dirty = useMemo(
    () => Object.keys(hero).some((k) => hero[k] !== original[k]),
    [hero, original],
  );

  const update = (key: string, value: string) =>
    setHero((prev) => ({ ...prev, [key]: value }));

  const updateBool = (key: string, value: boolean) => update(key, value ? "true" : "false");

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hero),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setHero(data.hero ?? hero);
      setOriginal(data.hero ?? hero);
      toast.success("Hero updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const variantId: HeroVariantId = isHeroVariantId(hero.hero_variant ?? "")
    ? (hero.hero_variant as HeroVariantId)
    : "classic";
  const variant = HERO_VARIANTS.find((v) => v.id === variantId)!;
  const visibleFields = new Set<string>(variant.fields);

  // Build a HeroData shape for the live preview using the in-flight values.
  const previewData: HeroData = useMemo(
    () => ({
      variant: variantId,
      tagline: hero.hero_tagline ?? "",
      title: hero.hero_title ?? "Your headline",
      subtitle: hero.hero_subtitle ?? "",
      description: hero.hero_description ?? "",
      ctaPrimary: hero.hero_cta_primary || "Get started",
      ctaSecondary: hero.hero_cta_secondary || "",
      primaryHref: hero.hero_cta_primary_href || "#",
      secondaryHref: hero.hero_cta_secondary_href || "#",
      backgroundImage: hero.hero_background_image ?? "",
      heroImage: hero.hero_image_url ?? "",
      showLatestPost: (hero.hero_show_latest_post ?? "true") !== "false",
      latestPostLabel: hero.hero_latest_post_label || "Latest insight",
      latestPostCta: hero.hero_latest_post_cta || "Read article",
      latestPost: {
        title: "Sample blog post — wired in from your latest /insights entry",
        slug: "sample",
        excerpt:
          "When this hero variant is selected, your most recent published blog post appears here automatically.",
        category: "Sample",
        publishedAt: new Date().toISOString(),
      },
    }),
    [variantId, hero],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> Hero
          </h1>
          <p className="text-muted-foreground">
            Pick a layout and edit the copy. The first thing visitors see, configured here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" /> Layout
          </CardTitle>
          <CardDescription>
            Choose a hero style. Each one uses your branding colors and reads from the same content fields below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {HERO_VARIANTS.map((v) => {
              const active = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update("hero_variant", v.id)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-all",
                    active
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "hover:border-foreground/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{v.name}</div>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
              <CardDescription>
                Only the fields used by the <strong>{variant.name}</strong> layout are shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleFields.has("hero_tagline") && (
                <Field
                  id="hero_tagline"
                  label="Tagline (small text above the headline)"
                  value={hero.hero_tagline ?? ""}
                  onChange={(v) => update("hero_tagline", v)}
                  placeholder="AI-Powered Business Systems"
                />
              )}
              {visibleFields.has("hero_title") && (
                <Field
                  id="hero_title"
                  label="Headline"
                  value={hero.hero_title ?? ""}
                  onChange={(v) => update("hero_title", v)}
                  placeholder="Your big headline"
                />
              )}
              {visibleFields.has("hero_subtitle") && (
                <Field
                  id="hero_subtitle"
                  label="Subtitle (optional)"
                  value={hero.hero_subtitle ?? ""}
                  onChange={(v) => update("hero_subtitle", v)}
                  placeholder="A short supporting line"
                />
              )}
              {visibleFields.has("hero_description") && (
                <div className="space-y-2">
                  <Label htmlFor="hero_description">Description</Label>
                  <textarea
                    id="hero_description"
                    rows={3}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={hero.hero_description ?? ""}
                    onChange={(e) => update("hero_description", e.target.value)}
                    placeholder="One paragraph that explains what you do."
                  />
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleFields.has("hero_cta_primary") && (
                  <>
                    <Field
                      id="hero_cta_primary"
                      label="Primary button label"
                      value={hero.hero_cta_primary ?? ""}
                      onChange={(v) => update("hero_cta_primary", v)}
                      placeholder="Get started"
                    />
                    <Field
                      id="hero_cta_primary_href"
                      label="Primary button link"
                      value={hero.hero_cta_primary_href ?? ""}
                      onChange={(v) => update("hero_cta_primary_href", v)}
                      placeholder="#audit or https://…"
                    />
                  </>
                )}
                {visibleFields.has("hero_cta_secondary") && (
                  <>
                    <Field
                      id="hero_cta_secondary"
                      label="Secondary button label (optional)"
                      value={hero.hero_cta_secondary ?? ""}
                      onChange={(v) => update("hero_cta_secondary", v)}
                      placeholder="See how it works"
                    />
                    <Field
                      id="hero_cta_secondary_href"
                      label="Secondary button link"
                      value={hero.hero_cta_secondary_href ?? ""}
                      onChange={(v) => update("hero_cta_secondary_href", v)}
                      placeholder="#solution"
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {(visibleFields.has("hero_background_image") || visibleFields.has("hero_image_url")) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Image</CardTitle>
                <CardDescription>
                  {visibleFields.has("hero_background_image")
                    ? "Full-bleed background. Use a wide landscape photo (≥ 1920px wide)."
                    : "Sits next to the headline. Portrait or square works best."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageField
                  value={
                    visibleFields.has("hero_background_image")
                      ? hero.hero_background_image ?? ""
                      : hero.hero_image_url ?? ""
                  }
                  onChange={(url) =>
                    update(
                      visibleFields.has("hero_background_image")
                        ? "hero_background_image"
                        : "hero_image_url",
                      url,
                    )
                  }
                />
              </CardContent>
            </Card>
          )}

          {variant.id === "latest-post-spotlight" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest post spotlight</CardTitle>
                <CardDescription>
                  Pulls the most recent published blog post from <code>/insights</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Switch
                    id="hero_show_latest_post"
                    checked={(hero.hero_show_latest_post ?? "true") !== "false"}
                    onCheckedChange={(v) => updateBool("hero_show_latest_post", v)}
                  />
                  <Label htmlFor="hero_show_latest_post" className="cursor-pointer">
                    Show the latest blog post in the hero
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    id="hero_latest_post_label"
                    label="Eyebrow text"
                    value={hero.hero_latest_post_label ?? ""}
                    onChange={(v) => update("hero_latest_post_label", v)}
                    placeholder="Latest insight"
                  />
                  <Field
                    id="hero_latest_post_cta"
                    label="Card CTA"
                    value={hero.hero_latest_post_cta ?? ""}
                    onChange={(v) => update("hero_latest_post_cta", v)}
                    placeholder="Read article"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
              <CardDescription>Scaled rendering of the actual hero component.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border" style={{ aspectRatio: "16 / 12" }}>
                <div
                  style={{
                    transform: "scale(0.45)",
                    transformOrigin: "top left",
                    width: "222%",
                    height: "222%",
                    pointerEvents: "none",
                  }}
                >
                  <HeroDispatcher {...previewData} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Preview reflects unsaved edits. Save to publish to the live site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4">
      {value ? (
        <div className="flex items-center justify-center bg-[radial-gradient(circle,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[length:8px_8px] rounded-md p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-48 w-full object-contain" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          No image yet
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <BlobUploadButton folder="hero" label={value ? "Replace image" : "Upload image"} onUploaded={onChange} />
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            <Trash2 className="mr-2 h-4 w-4" /> Remove
          </Button>
        )}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" className="text-xs" />
    </div>
  );
}
