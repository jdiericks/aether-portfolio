"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Eye, Loader2, MessageSquare, MousePointerClick, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InsightSummary {
  allTimeEvents: number;
  last30DaysEvents: number;
  last30DaysInquiries: number;
  listingViews: number;
  formSubmissions: number;
  whatsappClicks: number;
  highIntentEvents: number;
}

type LegacyInsightSummary = Partial<InsightSummary> & {
  totalEvents?: number;
};

interface CountRow {
  key?: string;
  label: string;
  count: number;
}

interface ClientCountRow {
  clientId: string | null;
  name: string;
  email?: string | null;
  packageType?: string | null;
  count: number;
}

interface RecentEvent {
  id: string;
  eventName: string;
  path: string | null;
  listingId?: string | null;
  clientId?: string | null;
  metadata?: unknown;
  createdAt: string;
}

interface InsightsResponse {
  totals: InsightSummary;
  topListings: CountRow[];
  eventsByName: CountRow[];
  topClients: ClientCountRow[];
  recent: RecentEvent[];
}

const emptyInsights: InsightsResponse = {
  totals: {
    allTimeEvents: 0,
    last30DaysEvents: 0,
    last30DaysInquiries: 0,
    listingViews: 0,
    formSubmissions: 0,
    whatsappClicks: 0,
    highIntentEvents: 0,
  },
  topListings: [],
  eventsByName: [],
  topClients: [],
  recent: [],
};

function eventCount(events: CountRow[], eventNames: string[]) {
  return events
    .filter((event) => eventNames.includes(event.label || event.key || ""))
    .reduce((sum, event) => sum + event.count, 0);
}

function normalizeInsights(value: unknown): InsightsResponse {
  if (!value || typeof value !== "object") return emptyInsights;
  const data = value as Partial<InsightsResponse> & {
    summary?: LegacyInsightSummary;
    topEvents?: CountRow[];
    recentEvents?: RecentEvent[];
  };
  const eventsByName = Array.isArray(data.eventsByName)
    ? data.eventsByName
    : Array.isArray(data.topEvents)
      ? data.topEvents
      : [];
  const totalsSource: LegacyInsightSummary = data.totals || data.summary || {};

  return {
    totals: {
      allTimeEvents: Number(totalsSource.allTimeEvents || 0),
      last30DaysEvents: Number(
        totalsSource.last30DaysEvents || totalsSource.totalEvents || 0
      ),
      last30DaysInquiries: Number(totalsSource.last30DaysInquiries || 0),
      listingViews: Number(
        totalsSource.listingViews || eventCount(eventsByName, ["listing_view"])
      ),
      formSubmissions: Number(
        totalsSource.formSubmissions ||
          eventCount(eventsByName, ["contact_form_submit", "listing_inquiry_submit"])
      ),
      whatsappClicks: Number(
        totalsSource.whatsappClicks || eventCount(eventsByName, ["whatsapp_click"])
      ),
      highIntentEvents: Number(
        totalsSource.highIntentEvents ||
          eventCount(eventsByName, [
            "contact_form_submit",
            "listing_inquiry_submit",
            "whatsapp_click",
            "phone_click",
            "client_curated_listing_click",
          ])
      ),
    },
    topListings: Array.isArray(data.topListings) ? data.topListings : [],
    eventsByName,
    topClients: Array.isArray(data.topClients) ? data.topClients : [],
    recent: Array.isArray(data.recent)
      ? data.recent
      : Array.isArray(data.recentEvents)
        ? data.recentEvents
        : [],
  };
}

export default function AdminInsightsPage() {
  const [insights, setInsights] = useState<InsightsResponse>(emptyInsights);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/insights");
      if (!response.ok) throw new Error("Failed to load insights");
      setInsights(normalizeInsights(await response.json()));
    } catch {
      setInsights(emptyInsights);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: "30-day events", value: insights.totals.last30DaysEvents, icon: Activity },
    { label: "Listing views", value: insights.totals.listingViews, icon: Eye },
    { label: "Form submissions", value: insights.totals.formSubmissions, icon: MessageSquare },
    { label: "WhatsApp clicks", value: insights.totals.whatsappClicks, icon: MousePointerClick },
    { label: "High-intent events", value: insights.totals.highIntentEvents, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">
          Track visitor activity, listing interest, inquiries, and high-intent actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No listing activity yet.</p>
            ) : (
              insights.topListings.map((row) => (
                <div key={row.key || row.label} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm">{row.label || row.key}</span>
                  <Badge variant="secondary">{row.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.eventsByName.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events tracked yet.</p>
            ) : (
              insights.eventsByName.map((row) => (
                <div key={row.key || row.label} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm">{row.label || row.key}</span>
                  <Badge variant="secondary">{row.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent high-intent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            insights.recent.map((event) => (
              <div key={event.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{event.eventName}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.path || event.listingId || "Site activity"}
                    </p>
                    {event.clientId && (
                      <p className="text-xs text-muted-foreground">Client: {event.clientId}</p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
