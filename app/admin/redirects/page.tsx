"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RedirectRule {
  id: string;
  sourcePath: string;
  destinationUrl: string;
  statusCode: number;
  isActive: boolean;
  preserveQuery: boolean;
  notes: string | null;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  sourcePath: "",
  destinationUrl: "",
  statusCode: "308",
  isActive: true,
  preserveQuery: true,
  notes: "",
};

export default function AdminRedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRedirects = useCallback(async () => {
    try {
      const response = await fetch("/api/redirects");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load redirects");
      setRedirects(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load redirects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editRedirect = (redirect: RedirectRule) => {
    setEditingId(redirect.id);
    setForm({
      sourcePath: redirect.sourcePath,
      destinationUrl: redirect.destinationUrl,
      statusCode: String(redirect.statusCode),
      isActive: redirect.isActive,
      preserveQuery: redirect.preserveQuery,
      notes: redirect.notes || "",
    });
  };

  const saveRedirect = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        statusCode: Number(form.statusCode),
      };
      const response = await fetch(editingId ? `/api/redirects/${editingId}` : "/api/redirects", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save redirect");
      toast.success(editingId ? "Redirect updated" : "Redirect created");
      resetForm();
      fetchRedirects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save redirect");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm("Delete this redirect?")) return;
    try {
      const response = await fetch(`/api/redirects/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete redirect");
      toast.success("Redirect deleted");
      fetchRedirects();
      if (editingId === id) resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete redirect");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Redirects</h1>
              <p className="text-sm text-muted-foreground">
                Send old URLs to new pages with SEO-friendly redirects.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {redirects.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No redirects configured yet.
            </p>
          ) : (
            redirects.map((redirect) => (
              <button
                key={redirect.id}
                type="button"
                onClick={() => editRedirect(redirect)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{redirect.sourcePath}</span>
                    <Badge variant={redirect.isActive ? "default" : "secondary"}>
                      {redirect.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{redirect.statusCode}</Badge>
                  </span>
                  <span className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {redirect.destinationUrl}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Hits: {redirect.hitCount}
                    {redirect.lastHitAt
                      ? ` · Last used ${new Date(redirect.lastHitAt).toLocaleDateString()}`
                      : ""}
                  </span>
                </span>
                <Trash2
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteRedirect(redirect.id);
                  }}
                />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{editingId ? "Edit redirect" : "New redirect"}</h2>
          <p className="text-sm text-muted-foreground">
            Use paths like <code className="rounded bg-muted px-1">/old-page</code> or full URLs from
            your domain. Destinations can be internal paths or external URLs.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redirect-source">Old URL / source path</Label>
            <Input
              id="redirect-source"
              value={form.sourcePath}
              onChange={(event) => setForm((prev) => ({ ...prev, sourcePath: event.target.value }))}
              placeholder="/old-listing-url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="redirect-destination">New URL / destination</Label>
            <Input
              id="redirect-destination"
              value={form.destinationUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, destinationUrl: event.target.value }))
              }
              placeholder="/listings/new-listing-url"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="redirect-status">Status code</Label>
              <select
                id="redirect-status"
                value={form.statusCode}
                onChange={(event) => setForm((prev) => ({ ...prev, statusCode: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="308">308 Permanent</option>
                <option value="301">301 Permanent</option>
                <option value="307">307 Temporary</option>
                <option value="302">302 Temporary</option>
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.preserveQuery}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preserveQuery: event.target.checked }))
              }
            />
            Preserve query strings from the old URL
          </label>
          <div className="space-y-2">
            <Label htmlFor="redirect-notes">Notes</Label>
            <textarea
              id="redirect-notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional reason, campaign, or migration note."
            />
          </div>
          <Button onClick={saveRedirect} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save redirect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
