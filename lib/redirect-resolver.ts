import { isMissingTableError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  appendQueryToDestination,
  normalizeRedirectSource,
  redirectLookupKeys,
  safeRedirectDestination,
} from "@/lib/redirects";

export interface ResolvedRedirectRule {
  destinationUrl: string;
  statusCode: number;
}

export async function resolveRedirectRule(path: string | null) {
  const sourcePath = normalizeRedirectSource(path);
  if (!sourcePath) return null;

  try {
    const lookupKeys = redirectLookupKeys(path);
    const redirect = await prisma.redirectRule.findFirst({
      where: { sourcePath: { in: lookupKeys }, isActive: true },
      orderBy: [{ sourcePath: "desc" }],
      select: { sourcePath: true, destinationUrl: true, statusCode: true, preserveQuery: true },
    });

    if (!redirect) return null;

    const destinationUrl = appendQueryToDestination(
      safeRedirectDestination(redirect.destinationUrl),
      redirect.preserveQuery && !redirect.sourcePath.includes("?")
        ? new URL(`https://example.com${sourcePath}`).search.slice(1)
        : ""
    );

    await prisma.redirectRule.update({
      where: { sourcePath: redirect.sourcePath },
      data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
    });

    return {
      destinationUrl,
      statusCode: redirect.statusCode,
    } satisfies ResolvedRedirectRule;
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}
