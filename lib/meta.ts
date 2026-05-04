import { prisma } from "@/lib/prisma";

const META_GRAPH_VERSION = "v20.0";
const META_AUTH_URL = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;
const META_TOKEN_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`;

export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "business_management",
].join(",");

export function getMetaConfig() {
  return {
    appId: process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "",
    redirectUri: process.env.META_REDIRECT_URI || "",
  };
}

export function getMetaConnectUrl(state: string) {
  const { appId, redirectUri } = getMetaConfig();
  if (!appId || !redirectUri) return null;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_SCOPES,
    response_type: "code",
    auth_type: "rerequest",
  });

  return `${META_AUTH_URL}?${params.toString()}`;
}

async function fetchMetaJson<T>(url: string) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data as T;
}

interface MetaPage {
  id: string;
  name: string;
  access_token?: string;
  businessId?: string;
  businessName?: string;
  source?: "user" | "business_owned" | "business_client";
}

interface MetaBusiness {
  id: string;
  name: string;
}

async function fetchPaginatedMeta<T extends object>(initialUrl: string) {
  const rows: T[] = [];
  let nextUrl: string | undefined = initialUrl;

  while (nextUrl) {
    const data: { data?: T[]; paging?: { next?: string } } = await fetchMetaJson(nextUrl);
    rows.push(...(data.data || []));
    nextUrl = data.paging?.next;
  }

  return rows;
}

function mergeMetaPages(pages: MetaPage[]) {
  const byId = new Map<string, MetaPage>();
  for (const page of pages) {
    const existing = byId.get(page.id);
    byId.set(page.id, {
      ...existing,
      ...page,
      access_token: page.access_token || existing?.access_token,
    });
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchAllMetaPages(accessToken: string) {
  const pages: MetaPage[] = [];
  const params = new URLSearchParams({
    fields: "id,name,access_token",
    limit: "100",
    access_token: accessToken,
  });

  const userPages = await fetchPaginatedMeta<MetaPage>(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts?${params.toString()}`
  );
  pages.push(...userPages.map((page) => ({ ...page, source: "user" as const })));

  const businessParams = new URLSearchParams({
    fields: "id,name",
    limit: "100",
    access_token: accessToken,
  });

  let businesses: MetaBusiness[] = [];
  try {
    businesses = await fetchPaginatedMeta<MetaBusiness>(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/me/businesses?${businessParams.toString()}`
    );
  } catch (error) {
    console.warn("Unable to fetch Meta businesses:", error);
  }

  for (const business of businesses) {
    for (const edge of ["owned_pages", "client_pages"] as const) {
      try {
        const businessPages = await fetchPaginatedMeta<MetaPage>(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${business.id}/${edge}?${params.toString()}`
        );
        pages.push(
          ...businessPages.map((page) => ({
            ...page,
            businessId: business.id,
            businessName: business.name,
            source: edge === "owned_pages" ? "business_owned" as const : "business_client" as const,
          }))
        );
      } catch (error) {
        console.warn(`Unable to fetch Meta ${edge} for business ${business.id}:`, error);
      }
    }
  }

  return mergeMetaPages(pages);
}

export async function exchangeMetaCode(code: string) {
  const { appId, appSecret, redirectUri } = getMetaConfig();
  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Meta OAuth is not configured.");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  return fetchMetaJson<{
    access_token: string;
    token_type?: string;
    expires_in?: number;
  }>(`${META_TOKEN_URL}?${params.toString()}`);
}

export async function loadMetaAccountData(accessToken: string) {
  const me = await fetchMetaJson<{ id: string; name?: string }>(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/me?fields=id,name&access_token=${accessToken}`
  );
  const pages = await fetchAllMetaPages(accessToken);

  return { me, pages };
}

export async function getActiveMetaConnection() {
  return prisma.metaConnection.findFirst({
    orderBy: { updatedAt: "desc" },
  });
}

export function findConnectedPage(
  connection: Awaited<ReturnType<typeof getActiveMetaConnection>>,
  pageId?: string | null
) {
  if (!connection || !Array.isArray(connection.pages)) return null;
  const pages = connection.pages as Array<{ id: string; name: string; access_token?: string }>;
  const selectedId = pageId || connection.selectedPageId || pages[0]?.id;
  return pages.find((page) => page.id === selectedId) || null;
}

export async function publishFacebookPost({
  caption,
  hashtags,
  mediaUrls,
  pageId,
}: {
  caption: string;
  hashtags?: string[];
  mediaUrls?: string[];
  pageId?: string | null;
}) {
  const connection = await getActiveMetaConnection();
  const page = findConnectedPage(connection, pageId);
  const token = page?.access_token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const targetPageId = page?.id || pageId || process.env.FACEBOOK_PAGE_ID;

  if (!token || !targetPageId) {
    throw new Error("No connected Facebook page or page access token is configured.");
  }

  const message = [caption, ...(hashtags || [])].join("\n\n");
  const imageUrl = mediaUrls?.find((url) => /\.(jpe?g|png|webp)(\?|$)/i.test(url));
  const endpoint = imageUrl ? "photos" : "feed";
  const body = imageUrl
    ? {
        url: imageUrl,
        caption: message,
        access_token: token,
      }
    : {
        message,
        access_token: token,
      };

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${targetPageId}/${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }
  return result as { id?: string };
}
