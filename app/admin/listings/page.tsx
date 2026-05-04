"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlobUploadButton } from "@/components/admin/blob-upload-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Listing {
  id: string;
  title: string;
  slug: string;
  address: string;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  municipality: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  price: string;
  priceCurrency: string;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  lotSize: string | null;
  status: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  gallery: unknown;
  facebookUrl: string | null;
  instagramUrl: string | null;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ListingFormState {
  title: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  municipality: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  price: string;
  priceCurrency: string;
  beds: string;
  baths: string;
  squareFeet: string;
  lotSize: string;
  status: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  gallery: string;
  facebookUrl: string;
  instagramUrl: string;
  isFeatured: boolean;
  order: string;
}

interface GalleryItemForm {
  url: string;
  type: "image" | "video";
  alt: string;
}

const emptyForm: ListingFormState = {
  title: "",
  address: "",
  city: "",
  state: "",
  neighborhood: "",
  municipality: "",
  postalCode: "",
  country: "MX",
  latitude: "",
  longitude: "",
  price: "",
  priceCurrency: "USD",
  beds: "",
  baths: "",
  squareFeet: "",
  lotSize: "",
  status: "active",
  description: "",
  imageUrl: "",
  videoUrl: "",
  gallery: "",
  facebookUrl: "",
  instagramUrl: "",
  isFeatured: true,
  order: "0",
};

function parseGalleryText(value: string): GalleryItemForm[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, type, alt] = line.split("|").map((part) => part.trim());
      const mediaType: "image" | "video" = type === "video" ? "video" : "image";
      return {
        url,
        type: mediaType,
        alt: alt || "",
      };
    })
    .filter((item) => item.url);
}

function galleryToItems(gallery: unknown): GalleryItemForm[] {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const media = item as { url?: unknown; type?: unknown; alt?: unknown };
      if (typeof media.url !== "string" || !media.url.trim()) return null;
      return {
        url: media.url,
        type: media.type === "video" ? "video" : "image",
        alt: typeof media.alt === "string" ? media.alt : "",
      } satisfies GalleryItemForm;
    })
    .filter((item): item is GalleryItemForm => item !== null);
}

function galleryItemsToText(items: GalleryItemForm[]) {
  return items
    .map((item) => [item.url, item.type, item.alt].join(" | "))
    .join("\n");
}

function parseGallery(value: string) {
  const items = parseGalleryText(value);
  return items.length > 0 ? items : null;
}

function listingToForm(listing: Listing): ListingFormState {
  return {
    title: listing.title,
    address: listing.address,
    city: listing.city || "",
    state: listing.state || "",
    neighborhood: listing.neighborhood || "",
    municipality: listing.municipality || "",
    postalCode: listing.postalCode || "",
    country: listing.country || "MX",
    latitude: listing.latitude?.toString() || "",
    longitude: listing.longitude?.toString() || "",
    price: listing.price,
    priceCurrency: listing.priceCurrency || "USD",
    beds: listing.beds?.toString() || "",
    baths: listing.baths?.toString() || "",
    squareFeet: listing.squareFeet?.toString() || "",
    lotSize: listing.lotSize || "",
    status: listing.status,
    description: listing.description || "",
    imageUrl: listing.imageUrl || "",
    videoUrl: listing.videoUrl || "",
    gallery: galleryItemsToText(galleryToItems(listing.gallery)),
    facebookUrl: listing.facebookUrl || "",
    instagramUrl: listing.instagramUrl || "",
    isFeatured: listing.isFeatured,
    order: listing.order.toString(),
  };
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPayload(form: ListingFormState) {
  return {
    title: form.title,
    address: form.address,
    city: form.city || null,
    state: form.state || null,
    neighborhood: form.neighborhood || null,
    municipality: form.municipality || null,
    postalCode: form.postalCode || null,
    country: form.country || "MX",
    latitude: toOptionalNumber(form.latitude),
    longitude: toOptionalNumber(form.longitude),
    price: form.price,
    priceCurrency: form.priceCurrency,
    beds: toOptionalNumber(form.beds),
    baths: toOptionalNumber(form.baths),
    squareFeet: toOptionalNumber(form.squareFeet),
    lotSize: form.lotSize || null,
    status: form.status,
    description: form.description || null,
    imageUrl: form.imageUrl || null,
    videoUrl: form.videoUrl || null,
    gallery: parseGallery(form.gallery),
    facebookUrl: form.facebookUrl || null,
    instagramUrl: form.instagramUrl || null,
    isFeatured: form.isFeatured,
    order: Number(form.order) || 0,
  };
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ListingFormState>(emptyForm);
  const galleryItems = parseGalleryText(form.gallery);

  const fetchListings = useCallback(async () => {
    try {
      const response = await fetch("/api/listings");
      if (!response.ok) throw new Error("Failed to load properties");
      setListings(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateField = <K extends keyof ListingFormState>(
    key: K,
    value: ListingFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateDialog = () => {
    setEditingListing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (listing: Listing) => {
    setEditingListing(listing);
    setForm(listingToForm(listing));
    setIsDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const url = editingListing ? `/api/listings/${editingListing.id}` : "/api/listings";
      const response = await fetch(url, {
        method: editingListing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save property");

      toast.success(editingListing ? "Property updated" : "Property created");
      setIsDialogOpen(false);
      fetchListings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save property");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (listing: Listing) => {
    if (!confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete property");

      toast.success("Property deleted");
      fetchListings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete property");
    }
  };

  const appendGalleryItem = (url: string, type: "image" | "video") => {
    updateGalleryItems([...galleryItems, { url, type, alt: "" }]);
  };

  const updateGalleryItems = (items: GalleryItemForm[]) => {
    setForm((prev) => ({
      ...prev,
      gallery: galleryItemsToText(items),
    }));
  };

  const updateGalleryItem = (
    index: number,
    updates: Partial<GalleryItemForm>
  ) => {
    updateGalleryItems(
      galleryItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      )
    );
  };

  const removeGalleryItem = (index: number) => {
    updateGalleryItems(galleryItems.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Create and manage public listings shown on the website.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Property
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-lg font-semibold">No properties yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first public property listing.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 overflow-hidden rounded bg-muted">
                        {listing.imageUrl ? (
                          <Image
                            src={listing.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{listing.price}</TableCell>
                  <TableCell>
                    <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                      {listing.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{listing.isFeatured ? "Yes" : "No"}</TableCell>
                  <TableCell>{listing.order}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/listings/${listing.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(listing)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(listing)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingListing ? "Edit Property" : "New Property"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={form.title} onChange={(e) => updateField("title", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input id="price" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="$925,000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCurrency">Currency</Label>
                <select
                  id="priceCurrency"
                  value={form.priceCurrency}
                  onChange={(e) => updateField("priceCurrency", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="MXN">MXN</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood / Colonia</Label>
                <Input id="neighborhood" value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipality">Municipality</Label>
                <Input id="municipality" value={form.municipality} onChange={(e) => updateField("municipality", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Region</Label>
                <Input id="state" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder="MX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beds">Beds</Label>
                <Input id="beds" type="number" min="0" value={form.beds} onChange={(e) => updateField("beds", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baths">Baths</Label>
                <Input id="baths" type="number" min="0" step="0.5" value={form.baths} onChange={(e) => updateField("baths", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squareFeet">Square feet</Label>
                <Input id="squareFeet" type="number" min="0" value={form.squareFeet} onChange={(e) => updateField("squareFeet", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotSize">Lot size</Label>
                <Input id="lotSize" value={form.lotSize} onChange={(e) => updateField("lotSize", e.target.value)} placeholder="0.25 acres" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display order</Label>
                <Input id="order" type="number" value={form.order} onChange={(e) => updateField("order", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">Primary image URL</Label>
                <div className="flex gap-2">
                  <Input id="imageUrl" value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)} placeholder="https://..." />
                  <BlobUploadButton
                    folder="listings"
                    accept="image/*"
                    onUploaded={(url) => updateField("imageUrl", url)}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="videoUrl">Featured video URL</Label>
                <div className="flex gap-2">
                  <Input id="videoUrl" value={form.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} placeholder="https://..." />
                  <BlobUploadButton
                    folder="listing-videos"
                    accept="video/*"
                    onUploaded={(url) => updateField("videoUrl", url)}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="gallery">Photo / video gallery</Label>
                  <div className="flex gap-2">
                    <BlobUploadButton
                      folder="listing-gallery"
                      accept="image/*"
                      label="Add Image"
                      onUploaded={(url) => appendGalleryItem(url, "image")}
                    />
                    <BlobUploadButton
                      folder="listing-gallery"
                      accept="video/*"
                      label="Add Video"
                      onUploaded={(url) => appendGalleryItem(url, "video")}
                    />
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border p-3">
                  {galleryItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add images or videos by uploading to Blob storage or pasting a media URL below.
                    </p>
                  ) : (
                    galleryItems.map((item, index) => (
                      <div key={`${item.url}-${index}`} className="grid gap-3 rounded-md border p-3 md:grid-cols-[96px_1fr_auto]">
                        <div className="relative aspect-video overflow-hidden rounded bg-muted">
                          {item.type === "video" ? (
                            <div className="flex h-full items-center justify-center text-xs uppercase text-muted-foreground">
                              Video
                            </div>
                          ) : (
                            <Image src={item.url} alt={item.alt || "Gallery item"} fill className="object-cover" sizes="96px" />
                          )}
                        </div>
                        <div className="grid gap-2">
                          <div className="grid gap-2 md:grid-cols-[1fr_120px]">
                            <Input
                              value={item.url}
                              onChange={(e) => updateGalleryItem(index, { url: e.target.value })}
                              placeholder="https://..."
                            />
                            <select
                              value={item.type}
                              onChange={(e) =>
                                updateGalleryItem(index, {
                                  type: e.target.value === "video" ? "video" : "image",
                                })
                              }
                              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                            </select>
                          </div>
                          <Input
                            value={item.alt}
                            onChange={(e) => updateGalleryItem(index, { alt: e.target.value })}
                            placeholder="Alt text / caption"
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeGalleryItem(index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                  <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <Input
                      id="gallery"
                      placeholder="Paste image or video URL, then choose Add Linked Image/Video"
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        const input = event.currentTarget;
                        if (!input.value.trim()) return;
                        appendGalleryItem(input.value.trim(), "image");
                        input.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("gallery") as HTMLInputElement | null;
                        if (!input?.value.trim()) return;
                        appendGalleryItem(input.value.trim(), "image");
                        input.value = "";
                      }}
                    >
                      Add Linked Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("gallery") as HTMLInputElement | null;
                        if (!input?.value.trim()) return;
                        appendGalleryItem(input.value.trim(), "video");
                        input.value = "";
                      }}
                    >
                      Add Linked Video
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description HTML</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={8}
                  placeholder="<p>Describe the property...</p><ul><li>Feature one</li></ul>"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Supports custom HTML. This content renders on the public listing page.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground md:col-span-2">
                Listing agent details are managed globally in Admin &gt; Website &gt;
                Brand &amp; Social and apply to every property.
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input id="facebookUrl" value={form.facebookUrl} onChange={(e) => updateField("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input id="instagramUrl" value={form.instagramUrl} onChange={(e) => updateField("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="featured">Featured on homepage</Label>
                <p className="text-sm text-muted-foreground">
                  Featured active listings appear on the homepage listing section.
                </p>
              </div>
              <Switch id="featured" checked={form.isFeatured} onCheckedChange={(value) => updateField("isFeatured", value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingListing ? "Save Property" : "Create Property"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
