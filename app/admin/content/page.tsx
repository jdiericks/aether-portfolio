"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContentPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  category: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
}

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
};

export default function AdminContentPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [form, setForm] = useState(emptyPost);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/content-posts");
      if (!response.ok) throw new Error("Failed to load posts");
      setPosts(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load content posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const editPost = (post: ContentPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      body: post.body,
      category: post.category || "",
      status: post.status,
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyPost);
  };

  const savePost = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(editingId ? `/api/content-posts/${editingId}` : "/api/content-posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save post");
      toast.success(editingId ? "Post updated" : "Post created");
      resetForm();
      fetchPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this content post?")) return;
    try {
      const response = await fetch(`/api/content-posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete post");
      toast.success("Post deleted");
      fetchPosts();
      if (editingId === id) resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
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
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Content Hub</h1>
              <p className="text-sm text-muted-foreground">Manage blog and market insight posts.</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {posts.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No content posts yet.
            </p>
          ) : (
            posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => editPost(post)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <span>
                  <span className="block font-medium">{post.title}</span>
                  <span className="text-xs text-muted-foreground">
                    /insights/{post.slug} - {post.status}
                  </span>
                </span>
                <Trash2
                  className="h-4 w-4 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    deletePost(post.id);
                  }}
                />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{editingId ? "Edit post" : "New post"}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="auto-generated if blank" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea id="excerpt" value={form.excerpt} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body HTML or Markdown-style paragraphs</Label>
            <textarea id="body" value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} rows={14} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input id="seoTitle" value={form.seoTitle} onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Input id="seoDescription" value={form.seoDescription} onChange={(event) => setForm((prev) => ({ ...prev, seoDescription: event.target.value }))} />
            </div>
          </div>
          <Button onClick={savePost} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save post
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
