"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, History, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  category: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface ActorFilter {
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  team: "bg-blue-100 text-blue-800",
  role: "bg-indigo-100 text-indigo-800",
  branding: "bg-purple-100 text-purple-800",
  auth: "bg-green-100 text-green-800",
  email: "bg-amber-100 text-amber-800",
  mcp: "bg-pink-100 text-pink-800",
  general: "bg-gray-100 text-gray-800",
};

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [actors, setActors] = useState<ActorFilter[]>([]);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [actorId, setActorId] = useState<string>("all");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (category !== "all") params.set("category", category);
      if (actorId !== "all") params.set("actorId", actorId);
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load audit log");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setCategories(data.filters?.categories ?? []);
      setActors(data.filters?.actors ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, category, actorId, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return (iso: string) => fmt.format(new Date(iso));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <History className="h-6 w-6" /> Audit log
          </h1>
          <p className="text-muted-foreground">
            Every admin action — who did what, when, and from where.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <form onSubmit={submitSearch} className="space-y-1">
            <Label htmlFor="audit-search" className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="audit-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Summary, actor, ID…"
                className="pl-8"
              />
            </div>
          </form>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setPage(1);
                setCategory(v);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Actor</Label>
            <Select
              value={actorId}
              onValueChange={(v) => {
                setPage(1);
                setActorId(v);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                {actors.map((a) =>
                  a.actorId ? (
                    <SelectItem key={a.actorId} value={a.actorId}>
                      {a.actorName || a.actorEmail || a.actorId}
                    </SelectItem>
                  ) : null,
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium uppercase text-muted-foreground bg-muted/40">
              <div className="col-span-3">Time</div>
              <div className="col-span-2">Actor</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-5">Summary</div>
            </div>
            {items.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No audit log entries match these filters.
              </div>
            ) : (
              items.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="grid grid-cols-12 gap-3 px-4 py-2 text-sm w-full text-left hover:bg-muted/30 transition-colors items-center"
                >
                  <div className="col-span-3 text-xs text-muted-foreground font-mono">
                    {formatDate(entry.createdAt)}
                  </div>
                  <div className="col-span-2 text-xs">
                    {entry.actorName || entry.actorEmail || (
                      <span className="italic text-muted-foreground">system</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono",
                        CATEGORY_COLORS[entry.category] ?? "bg-gray-100 text-gray-800",
                      )}
                    >
                      {entry.category}
                    </Badge>
                  </div>
                  <div className="col-span-5 truncate">{entry.summary}</div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {total === 0
            ? "No entries"
            : `Showing ${(page - 1) * 50 + 1}–${Math.min(page * 50, total)} of ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selected && (
        <Dialog open onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm">{selected.action}</DialogTitle>
              <DialogDescription>{selected.summary}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <DetailRow label="When" value={formatDate(selected.createdAt)} />
              <DetailRow
                label="Actor"
                value={
                  selected.actorName
                    ? `${selected.actorName} <${selected.actorEmail ?? ""}>`
                    : "System"
                }
              />
              <DetailRow label="Category" value={selected.category} />
              {selected.entityType && (
                <DetailRow
                  label="Entity"
                  value={`${selected.entityType}${selected.entityId ? ` · ${selected.entityId}` : ""}`}
                />
              )}
              {selected.ipAddress && <DetailRow label="IP" value={selected.ipAddress} />}
              {selected.userAgent && (
                <DetailRow label="User agent" value={selected.userAgent} truncate />
              )}
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Metadata</Label>
                  <pre className="rounded-md bg-muted/40 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={cn("col-span-2 font-mono text-xs", truncate && "truncate")}>{value}</div>
    </div>
  );
}
