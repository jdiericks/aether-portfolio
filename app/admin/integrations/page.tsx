"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetaConnectionStatus {
  connected: boolean;
  connection?: {
    id: string;
    providerUserName: string | null;
    expiresAt: string | null;
    selectedPageId: string | null;
    scopes: string[];
    pages: unknown;
  };
  configured: boolean;
  redirectUri: string;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<MetaConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [isRefreshingPages, setIsRefreshingPages] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/meta/status");
      if (!response.ok) throw new Error("Failed to load Meta integration");
      setStatus(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const disconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/meta/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Failed to disconnect Meta");
      toast.success("Meta account disconnected");
      fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect Meta");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const saveDefaultPage = async (pageId: string) => {
    setIsSavingPage(true);
    try {
      const response = await fetch("/api/meta/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedPageId: pageId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update default Facebook page");
      }
      setStatus(data);
      toast.success("Default Facebook page updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update default Facebook page");
    } finally {
      setIsSavingPage(false);
    }
  };

  const refreshPages = async () => {
    setIsRefreshingPages(true);
    try {
      const response = await fetch("/api/meta/status", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh Facebook pages");
      }
      setStatus(data);
      toast.success("Facebook pages refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh Facebook pages");
    } finally {
      setIsRefreshingPages(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pages = asArray(status?.connection?.pages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect Meta so listing social drafts can be published to Facebook pages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Meta / Facebook Pages</CardTitle>
            <Badge variant={status?.connected ? "default" : "secondary"}>
              {status?.connected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!status?.configured && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Set <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, and{" "}
              <code>META_REDIRECT_URI</code> in Vercel before connecting Meta.
              Redirect URI should be:
              <br />
              <code>{status?.redirectUri}</code>
            </div>
          )}

          {status?.connected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Connected account</p>
                <p className="font-medium">
                  {status.connection?.providerUserName || "Meta account"}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Facebook Pages</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={refreshPages}
                      disabled={isRefreshingPages}
                    >
                      {isRefreshingPages && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Refresh pages
                    </Button>
                  </div>
                  {pages.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No pages returned.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-2">
                        <label
                          htmlFor="selectedPageId"
                          className="text-sm font-medium"
                        >
                          Default publishing page
                        </label>
                        <select
                          id="selectedPageId"
                          value={status.connection?.selectedPageId || ""}
                          onChange={(event) => saveDefaultPage(event.target.value)}
                          disabled={isSavingPage}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Choose a page</option>
                          {pages.map((page, index) => {
                            const item = page as { id?: string; name?: string };
                            return (
                              <option key={item.id || index} value={item.id || ""}>
                                {item.name || "Facebook Page"}
                                {item.id ? ` (${item.id})` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {pages.map((page, index) => {
                          const item = page as { id?: string; name?: string };
                          const isSelected = item.id === status.connection?.selectedPageId;
                          return (
                            <li key={item.id || index}>
                              {item.name || "Facebook Page"}{" "}
                              {item.id && <span className="text-muted-foreground">({item.id})</span>}
                              {isSelected && <Badge className="ml-2">Default</Badge>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-3 rounded-lg border p-4 text-sm text-muted-foreground">
                  <p>
                    This connection requests Facebook Page and Business Portfolio
                    access only. Instagram OAuth scopes are disabled.
                  </p>
                  <p>
                    If expected Business Portfolio pages are missing, reconnect Meta
                    and choose all relevant businesses/pages during the permission
                    flow, then click Refresh pages.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = "/api/meta/connect";
                    }}
                  >
                    Reconnect / choose pages
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={disconnect} disabled={isDisconnecting}>
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="mr-2 h-4 w-4" />
                )}
                Disconnect Meta
              </Button>
            </div>
          ) : (
            <Button
              disabled={!status?.configured}
              onClick={() => {
                window.location.href = "/api/meta/connect";
              }}
            >
              <Plug className="mr-2 h-4 w-4" />
              Connect Meta Account
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
