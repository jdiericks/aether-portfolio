import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content";

// Subset of SiteContent keys exposed by the focused Branding admin page.
// Keep this list narrow — Branding is the "white-label essentials" view, not
// the full Website Settings editor.
export const BRANDING_KEYS = [
  // Identity
  "brand_name",
  "brand_subtitle",
  "brand_logo_url",
  "brand_favicon_url",
  "brand_header_show_text",

  // Colors / theme
  "theme_primary",
  "theme_primary_foreground",
  "theme_accent",
  "theme_accent_foreground",
  "theme_background",
  "theme_foreground",
  "theme_radius",

  // Footer / legal
  "footer_tagline",
  "footer_legal_entity",
  "footer_copyright",

  // White-label "powered by"
  "branding_product_name",
  "branding_show_powered_by",
  "branding_powered_by_text",
  "branding_powered_by_url",
] as const;

export type BrandingKey = (typeof BRANDING_KEYS)[number];

function pickBranding(content: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const key of BRANDING_KEYS) {
    out[key] = content[key] ?? SITE_CONTENT_DEFAULTS[key] ?? "";
  }
  return out;
}

async function loadAllContent() {
  const rows = await prisma.siteContent.findMany();
  const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
  for (const row of rows) content[row.key] = row.value;
  return content;
}

export async function GET() {
  const result = await requirePermission("website.manage");
  if (result.error) return result.error;

  const content = await loadAllContent();
  return NextResponse.json({ branding: pickBranding(content) });
}

export async function PATCH(request: Request) {
  const result = await requirePermission("website.manage");
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!BRANDING_KEYS.includes(key as BrandingKey)) continue;
    if (typeof value !== "string") continue;
    updates.push({ key, value });
  }

  if (updates.length === 0) {
    const content = await loadAllContent();
    return NextResponse.json({ branding: pickBranding(content) });
  }

  await prisma.$transaction(
    updates.map(({ key, value }) =>
      prisma.siteContent.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  const content = await loadAllContent();
  return NextResponse.json({ branding: pickBranding(content) });
}
