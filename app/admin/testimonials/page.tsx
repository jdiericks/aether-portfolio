"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  quote: string;
  rating: number | null;
  imageUrl: string | null;
  status: string;
  isFeatured: boolean;
  order: number;
}

const emptyForm = {
  name: "",
  role: "",
  location: "",
  quote: "",
  rating: "",
  imageUrl: "",
  status: "published",
  isFeatured: true,
  order: "0",
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await fetch("/api/testimonials");
      if (!response.ok) throw new Error("Failed to load testimonials");
      setTestimonials(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load testimonials");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editTestimonial = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setForm({
      name: testimonial.name,
      role: testimonial.role || "",
      location: testimonial.location || "",
      quote: testimonial.quote,
      rating: testimonial.rating ? String(testimonial.rating) : "",
      imageUrl: testimonial.imageUrl || "",
      status: testimonial.status,
      isFeatured: testimonial.isFeatured,
      order: String(testimonial.order || 0),
    });
  };

  const saveTestimonial = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        rating: form.rating ? Number(form.rating) : null,
        order: Number(form.order || 0),
      };
      const response = await fetch(editingId ? `/api/testimonials/${editingId}` : "/api/testimonials", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save testimonial");
      toast.success(editingId ? "Testimonial updated" : "Testimonial created");
      resetForm();
      fetchTestimonials();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save testimonial");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      const response = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete testimonial");
      toast.success("Testimonial deleted");
      fetchTestimonials();
      if (editingId === id) resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete testimonial");
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
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Testimonials</h1>
              <p className="text-sm text-muted-foreground">Manage homepage testimonials.</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {testimonials.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No testimonials yet.
            </p>
          ) : (
            testimonials.map((testimonial) => (
              <button
                key={testimonial.id}
                type="button"
                onClick={() => editTestimonial(testimonial)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <span>
                  <span className="block font-medium">{testimonial.name}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {testimonial.quote}
                  </span>
                </span>
                <Trash2
                  className="h-4 w-4 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteTestimonial(testimonial.id);
                  }}
                />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit testimonial" : "New testimonial"}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="testimonial-name">Name</Label>
              <Input
                id="testimonial-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonial-role">Role / Relationship</Label>
              <Input
                id="testimonial-role"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                placeholder="Buyer, seller, investor..."
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="testimonial-location">Location</Label>
              <Input
                id="testimonial-location"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonial-rating">Rating</Label>
              <Input
                id="testimonial-rating"
                type="number"
                min="1"
                max="5"
                value={form.rating}
                onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonial-order">Order</Label>
              <Input
                id="testimonial-order"
                type="number"
                min="0"
                value={form.order}
                onChange={(event) => setForm((prev) => ({ ...prev, order: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="testimonial-image">Image URL</Label>
            <Input
              id="testimonial-image"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testimonial-quote">Quote</Label>
            <textarea
              id="testimonial-quote"
              value={form.quote}
              onChange={(event) => setForm((prev) => ({ ...prev, quote: event.target.value }))}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="testimonial-status">Status</Label>
              <select
                id="testimonial-status"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
              />
              Show on homepage
            </label>
          </div>
          <Button onClick={saveTestimonial} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save testimonial
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
