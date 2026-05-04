import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const WEBMASTERS_API_BASE = "https://www.googleapis.com/webmasters/v3";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
}

interface GoogleServiceAccountJson {
  client_email?: string;
  private_key?: string;
}

export interface SearchConsoleRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchConsoleQueryOptions {
  siteUrl?: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  startRow?: number;
  queryContains?: string;
  pageContains?: string;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function getServiceAccountConfig(): ServiceAccountConfig {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const parsed = JSON.parse(json) as GoogleServiceAccountJson;
    if (parsed.client_email && parsed.private_key) {
      return {
        clientEmail: parsed.client_email,
        privateKey: normalizePrivateKey(parsed.private_key),
      };
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Search Console is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }

  return {
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

export function getDefaultSearchConsoleSiteUrl() {
  return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.GSC_SITE_URL || "";
}

async function getAccessToken() {
  const { clientEmail, privateKey } = getServiceAccountConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SEARCH_CONSOLE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = base64Url(signer.sign(privateKey));
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to authenticate with Google: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

async function googleSearchConsoleFetch<T>(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${WEBMASTERS_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data as T;
}

function dimensionFilters(options: SearchConsoleQueryOptions) {
  const filters = [];
  if (options.queryContains) {
    filters.push({
      dimension: "query",
      operator: "contains",
      expression: options.queryContains,
    });
  }
  if (options.pageContains) {
    filters.push({
      dimension: "page",
      operator: "contains",
      expression: options.pageContains,
    });
  }

  return filters.length > 0
    ? [
        {
          groupType: "and",
          filters,
        },
      ]
    : undefined;
}

export async function listSearchConsoleSites() {
  const result = await googleSearchConsoleFetch<{
    siteEntry?: Array<{ siteUrl: string; permissionLevel: string }>;
  }>("/sites");
  return result.siteEntry || [];
}

export async function querySearchConsole(options: SearchConsoleQueryOptions) {
  const siteUrl = options.siteUrl || getDefaultSearchConsoleSiteUrl();
  if (!siteUrl) {
    throw new Error("Missing Search Console site URL. Set GOOGLE_SEARCH_CONSOLE_SITE_URL or pass siteUrl.");
  }

  const body = {
    startDate: options.startDate,
    endDate: options.endDate,
    dimensions: options.dimensions || ["query", "page"],
    rowLimit: options.rowLimit || 100,
    startRow: options.startRow || 0,
    dimensionFilterGroups: dimensionFilters(options),
  };

  const result = await googleSearchConsoleFetch<{ rows?: SearchConsoleRow[] }>(
    `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return {
    siteUrl,
    rows: result.rows || [],
  };
}

export function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
