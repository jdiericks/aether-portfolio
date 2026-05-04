import { notFound, redirect, permanentRedirect } from "next/navigation";
import { resolveRedirectRule } from "@/lib/redirect-resolver";
import { shouldSkipRedirectLookup } from "@/lib/redirects";

interface RedirectFallbackPageProps {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function searchParamsToString(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function RedirectFallbackPage({
  params,
  searchParams,
}: RedirectFallbackPageProps) {
  const [{ path = [] }, queryParams] = await Promise.all([params, searchParams]);
  const pathname = `/${path.join("/")}`;

  if (!shouldSkipRedirectLookup(pathname)) {
    const redirectRule = await resolveRedirectRule(
      `${pathname}${searchParamsToString(queryParams)}`
    );

    if (redirectRule) {
      if (redirectRule.statusCode === 301 || redirectRule.statusCode === 308) {
        permanentRedirect(redirectRule.destinationUrl);
      }

      redirect(redirectRule.destinationUrl);
    }
  }

  notFound();
}
