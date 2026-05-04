const INTERNAL_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/dashboard",
  "/login",
  "/_next",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
  "/llm-ctx.txt",
];

const STATIC_ASSET_EXTENSION_PATTERN =
  /\.(?:avif|bmp|css|gif|ico|jpeg|jpg|js|json|map|mp3|mp4|pdf|png|svg|webm|webp|woff|woff2)$/i;

function isLikelyExternalUrl(value: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

export function normalizeRedirectSource(value: unknown) {
  if (typeof value !== "string") return null;

  let source = value.trim();
  if (!source) return null;

  if (isLikelyExternalUrl(source)) {
    try {
      const url = new URL(source);
      source = `${url.pathname}${url.search}` || "/";
    } catch {
      return null;
    }
  }

  if (!source.startsWith("/")) source = `/${source}`;
  source = source.replace(/\/{2,}/g, "/");

  if (source.length > 1 && source.endsWith("/")) {
    source = source.slice(0, -1);
  }

  return source;
}

export function normalizeRedirectDestination(value: unknown) {
  if (typeof value !== "string") return null;

  const destination = value.trim();
  if (!destination) return null;

  if (isLikelyExternalUrl(destination)) {
    try {
      return new URL(destination).toString();
    } catch {
      return null;
    }
  }

  const withSlash = destination.startsWith("/") ? destination : `/${destination}`;
  return withSlash.replace(/\/{2,}/g, "/");
}

export function safeRedirectDestination(value: unknown) {
  const destination = normalizeRedirectDestination(value);
  return destination || "/";
}

export function appendQueryToDestination(destination: string, query: string | null) {
  if (!query) return destination;

  const [base, hash = ""] = destination.split("#", 2);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${query}${hash ? `#${hash}` : ""}`;
}

export function redirectLookupKeys(value: unknown) {
  const sourcePath = normalizeRedirectSource(value);
  if (!sourcePath) return [];

  const keys = new Set([sourcePath]);
  const pathOnly = normalizeRedirectSource(sourcePath.split("?")[0]);
  if (pathOnly) {
    keys.add(pathOnly);
    if (pathOnly.length > 1) {
      keys.add(`${pathOnly}/`);
    }
  }

  if (sourcePath.length > 1 && sourcePath.endsWith("/")) {
    const withoutTrailingSlash = normalizeRedirectSource(sourcePath.slice(0, -1));
    if (withoutTrailingSlash) keys.add(withoutTrailingSlash);
  }

  return Array.from(keys);
}

export function shouldSkipRedirectLookup(pathname: string) {
  if (STATIC_ASSET_EXTENSION_PATTERN.test(pathname)) return true;
  return INTERNAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
