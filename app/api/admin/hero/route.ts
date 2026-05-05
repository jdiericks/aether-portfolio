import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content";
import { recordAuditLog } from "@/lib/audit-log";

const HERO_KEYS = [
  "hero_variant",
  "hero_background_image",
  "hero_image_url",
  "hero_tagline",
  "hero_title",
  "hero_subtitle",
  "hero_description",
  "hero_cta_primary",
  "hero_cta_secondary",
  "hero_cta_primary_href",
  "hero_cta_secondary_href",
  "hero_show_latest_post",
  "hero_latest_post_label",
  "hero_latest_post_cta",
] as const;

type HeroKey = (typeof HERO_KEYS)[number];

async function loadAllContent() {
  const rows = await prisma.siteContent.findMany();
  const content: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
  for (const row of rows) content[row.key] = row.value;
  return content;
}

function pickHeroSettings(content: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const key of HERO_KEYS) {
    out[key] = content[key] ?? SITE_CONTENT_DEFAULTS[key] ?? "";
  }
  return out;
}

export async function GET() {
  const result = await requirePermission("website.manage");
  if (result.error) return result.error;
  const content = await loadAllContent();
  return NextResponse.json({ hero: pickHeroSettings(content) });
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
    if (!HERO_KEYS.includes(key as HeroKey)) continue;
    if (typeof value !== "string") continue;
    updates.push({ key, value });
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(({ key, value }) =>
        prisma.siteContent.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );

    await recordAuditLog({
      actor: result.admin,
      action: "website.hero.update",
      category: "website",
      summary: `Updated hero (${updates.map((u) => u.key).join(", ")})`,
      metadata: { keys: updates.map((u) => u.key) },
      request,
    });
  }

  const content = await loadAllContent();
  return NextResponse.json({ hero: pickHeroSettings(content) });
}
