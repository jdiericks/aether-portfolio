"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ListingSummary {
  id: string;
  title: string;
  slug: string;
}

interface FacebookPageOption {
  id: string;
  name: string;
}

interface SocialPost {
  id: string;
  listingId: string | null;
  platform: string;
  status: string;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetPageId: string | null;
  publishedUrl: string | null;
  createdAt: string;
  listing: ListingSummary | null;
}

interface FormState {
  listingId: string;
  platform: string;
  status: string;
  caption: string;
  hashtags: string;
  mediaUrls: string;
  targetPageId: string;
}

const emptyForm: FormState = {
  listingId: "",
  platform: "facebook",
  status: "draft",
  caption: "",
  hashtags: "",
  mediaUrls: "",
  targetPageId: "",
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitTags(value: string) {
  return value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`));
}

function postToForm(post: SocialPost): FormState {
  return {
    listingId: post.listingId || "",
    platform: post.platform,
    status: post.status,
    caption: post.caption,
    hashtags: post.hashtags.join(", "),
    mediaUrls: post.mediaUrls.join("\n"),
    targetPageId: post.targetPageId || "",
  };
}

export default function AdminSocialPostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [facebookPages, setFacebookPages] = useState<FacebookPageOption[]>([]);
  const [defaultPageId, setDefaultPageId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [postsResponse, listingsResponse, metaResponse] = await Promise.all([
        fetch("/api/social-posts"),
        fetch("/api/listings"),
        fetch("/api/meta/status"),
      ]);
      if (!postsResponse.ok) throw new Error("Failed to load social posts");
      setPosts(await postsResponse.json());
      if (listingsResponse.ok) {
        setListings(await listingsResponse.json());
      }
      if (metaResponse.ok) {
        const metaStatus = await metaResponse.json();
        setDefaultPageId(metaStatus.connection?.selectedPageId || "");
        setFacebookPages(
          Array.isArray(metaStatus.connection?.pages)
            ? metaStatus.connection.pages
                .map((page: unknown) => {
                  const item = page as { id?: unknown; name?: unknown };
                  return typeof item.id === "string"
                    ? {
                        id: item.id,
                        name: typeof item.name === "string" ? item.name : item.id,
                      }
                    : null;
                })
                .filter(Boolean)
            : []
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load social posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateDialog = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (post: SocialPost) => {
    setEditingPost(post);
    setForm(postToForm(post));
    setIsDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!form.listingId) {
      toast.error("Choose a listing first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: form.listingId,
          platform: form.platform,
          generate: true,
          targetPageId: form.targetPageId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate post");
      toast.success("Social post draft generated");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate post");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const url = editingPost ? `/api/social-posts/${editingPost.id}` : "/api/social-posts";
      const response = await fetch(url, {
        method: editingPost ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: form.listingId || null,
          platform: form.platform,
          status: form.status,
          caption: form.caption,
          hashtags: splitTags(form.hashtags),
          mediaUrls: splitLines(form.mediaUrls),
          targetPageId: form.targetPageId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save post");
      toast.success(editingPost ? "Social post updated" : "Social post created");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (post: SocialPost) => {
    if (!confirm("Delete this social post draft?")) return;
    try {
      const response = await fetch(`/api/social-posts/${post.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete post");
      toast.success("Social post deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
    }
  };

  const copyPost = async (post: SocialPost) => {
    const text = [post.caption, post.hashtags.join(" ")].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(text);
    toast.success("Post text copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Posts</h1>
          <p className="text-muted-foreground">
            Generate and manage Facebook, Instagram, TikTok, and other listing post drafts.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-lg font-semibold">No social posts yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate a listing post draft to start marketing on Facebook or Instagram.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm">{post.caption}</p>
                      {post.publishedUrl && (
                        <a
                          href={post.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center text-xs text-primary hover:underline"
                        >
                          View published post
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{post.platform}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {post.listing ? (
                        <Link
                          href={`/listings/${post.listing.slug}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {post.listing.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyPost(post)}>
                          Copy
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Social Post" : "New Social Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listingId">Listing</Label>
                <select
                  id="listingId"
                  value={form.listingId}
                  onChange={(event) => updateField("listingId", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No listing</option>
                  {listings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={form.platform}
                  onChange={(event) => updateField("platform", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="x">X</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetPageId">Facebook Page</Label>
              {facebookPages.length > 0 ? (
                <select
                  id="targetPageId"
                  value={form.targetPageId}
                  onChange={(event) => updateField("targetPageId", event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">
                    Use default page
                    {defaultPageId ? ` (${defaultPageId})` : ""}
                  </option>
                  {facebookPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name} ({page.id})
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="targetPageId"
                  value={form.targetPageId}
                  onChange={(event) => updateField("targetPageId", event.target.value)}
                  placeholder="Leave blank to use the default Meta page"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Set a page ID here to override the default page selected in Integrations.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <textarea
                id="caption"
                value={form.caption}
                onChange={(event) => updateField("caption", event.target.value)}
                rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Write the post caption..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={form.hashtags}
                onChange={(event) => updateField("hashtags", event.target.value)}
                placeholder="#BajaRealEstate, #EnsenadaHomes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mediaUrls">Media URLs</Label>
              <textarea
                id="mediaUrls"
                value={form.mediaUrls}
                onChange={(event) => updateField("mediaUrls", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="One media URL per line"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate from Listing
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
