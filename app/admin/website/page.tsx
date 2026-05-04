"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  Loader2,
  Edit2,
  ExternalLink,
  Save,
  ImageIcon,
  Type,
  Phone,
  Share2,
  Search,
  FileText,
  Palette,
  Languages,
  Accessibility,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { BlobUploadButton } from "@/components/admin/blob-upload-button";
import { Switch } from "@/components/ui/switch";

interface SiteContentMap {
  [key: string]: string;
}

interface PortfolioPhoto {
  id: string;
  url: string;
  filename: string;
  caption: string | null;
  order: number;
}

export default function WebsitePage() {
  const [content, setContent] = useState<SiteContentMap>({});
  const [original, setOriginal] = useState<SiteContentMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PortfolioPhoto | null>(null);
  const [editCaption, setEditCaption] = useState("");

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch("/api/site-content");
      const data = await response.json();
      setContent(data);
      setOriginal(data);
    } catch {
      toast.error("Failed to load site content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch("/api/portfolio");
      const data = await response.json();
      setPhotos(data);
    } catch {
      toast.error("Failed to load portfolio");
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchPhotos();
  }, [fetchContent, fetchPhotos]);

  const updateField = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges = () => {
    return Object.keys(content).some((key) => content[key] !== original[key]);
  };

  const saveContent = async () => {
    setIsSaving(true);
    try {
      const changed: Record<string, string> = {};
      for (const key of Object.keys(content)) {
        if (content[key] !== original[key]) {
          changed[key] = content[key];
        }
      }
      const response = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      if (!response.ok) throw new Error("Failed to save");
      const data = await response.json();
      setContent(data);
      setOriginal(data);
      toast.success("Website content saved");
    } catch {
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setIsUploading(true);
      let successCount = 0;
      for (const file of acceptedFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/portfolio", {
            method: "POST",
            body: formData,
          });
          if (response.ok) successCount++;
        } catch {
          /* skip failed uploads */
        }
      }
      setIsUploading(false);
      if (successCount > 0) {
        toast.success(
          `${successCount} photo${successCount > 1 ? "s" : ""} uploaded`
        );
        fetchPhotos();
      }
    },
    [fetchPhotos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    disabled: isUploading,
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Photo deleted");
      fetchPhotos();
    } catch {
      toast.error("Failed to delete photo");
    }
  };

  const handleEditSave = async () => {
    if (!editingPhoto) return;
    try {
      const response = await fetch(`/api/portfolio/${editingPhoto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaption }),
      });
      if (!response.ok) throw new Error("Failed to update");
      toast.success("Caption updated");
      setEditingPhoto(null);
      fetchPhotos();
    } catch {
      toast.error("Failed to update caption");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website</h1>
          <p className="text-muted-foreground">
            Edit the content displayed on your landing page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Site
            </Link>
          </Button>
          <Button onClick={saveContent} disabled={isSaving || !hasChanges()}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="hero">
            <ImageIcon className="mr-1.5 h-4 w-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="about">
            <Type className="mr-1.5 h-4 w-4" />
            About
          </TabsTrigger>
          <TabsTrigger value="portfolio">
            <ImageIcon className="mr-1.5 h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="mr-1.5 h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="mr-1.5 h-4 w-4" />
            Logo & Brand
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="mr-1.5 h-4 w-4" />
            SEO & Meta
          </TabsTrigger>
          <TabsTrigger value="legal">
            <FileText className="mr-1.5 h-4 w-4" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-1.5 h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="translation">
            <Languages className="mr-1.5 h-4 w-4" />
            Translate & Currency
          </TabsTrigger>
          <TabsTrigger value="accessibility">
            <Accessibility className="mr-1.5 h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="mr-1.5 h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* ─── Hero Section ─── */}
        <TabsContent value="hero" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Hero Section</h2>
              <p className="text-sm text-muted-foreground">
                The first thing visitors see when they land on your site
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hero_background_image">
                  Background Image URL
                </Label>
                <Input
                  id="hero_background_image"
                  value={content.hero_background_image || ""}
                  onChange={(e) =>
                    updateField("hero_background_image", e.target.value)
                  }
                  placeholder="https://..."
                />
                <BlobUploadButton
                  folder="website"
                  accept="image/*"
                  label="Upload Hero Image"
                  onUploaded={(url) => updateField("hero_background_image", url)}
                />
                {content.hero_background_image && (
                  <div className="relative mt-2 h-48 w-full max-w-lg rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={content.hero_background_image}
                      alt="Hero background preview"
                      fill
                      className="object-cover"
                      sizes="512px"
                    />
                  </div>
                )}
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_tagline">Tagline</Label>
                  <Input
                    id="hero_tagline"
                    value={content.hero_tagline || ""}
                    onChange={(e) =>
                      updateField("hero_tagline", e.target.value)
                    }
                    placeholder="Boutique Real Estate Advisory"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Title</Label>
                  <Input
                    id="hero_title"
                    value={content.hero_title || ""}
                    onChange={(e) => updateField("hero_title", e.target.value)}
                    placeholder="Diericks"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Subtitle</Label>
                  <Input
                    id="hero_subtitle"
                    value={content.hero_subtitle || ""}
                    onChange={(e) =>
                      updateField("hero_subtitle", e.target.value)
                    }
                    placeholder="Realty"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_description">Description</Label>
                <textarea
                  id="hero_description"
                  value={content.hero_description || ""}
                  onChange={(e) =>
                    updateField("hero_description", e.target.value)
                  }
                  placeholder="Curated guidance for buyers and sellers..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_cta_primary">Primary Button Text</Label>
                  <Input
                    id="hero_cta_primary"
                    value={content.hero_cta_primary || ""}
                    onChange={(e) =>
                      updateField("hero_cta_primary", e.target.value)
                    }
                    placeholder="View Our Work"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_cta_secondary">
                    Secondary Button Text
                  </Label>
                  <Input
                    id="hero_cta_secondary"
                    value={content.hero_cta_secondary || ""}
                    onChange={(e) =>
                      updateField("hero_cta_secondary", e.target.value)
                    }
                    placeholder="Get in Touch"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── About Section ─── */}
        <TabsContent value="about" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">About Section</h2>
              <p className="text-sm text-muted-foreground">
                Tell visitors about your brokerage and advisory approach
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="about_label">Section Label</Label>
                  <Input
                    id="about_label"
                    value={content.about_label || ""}
                    onChange={(e) =>
                      updateField("about_label", e.target.value)
                    }
                    placeholder="About Us"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_title">Title</Label>
                  <Input
                    id="about_title"
                    value={content.about_title || ""}
                    onChange={(e) =>
                      updateField("about_title", e.target.value)
                    }
                    placeholder="Your Story, Authentically Told"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="about_description_1">First Paragraph</Label>
                <textarea
                  id="about_description_1"
                  value={content.about_description_1 || ""}
                  onChange={(e) =>
                    updateField("about_description_1", e.target.value)
                  }
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about_description_2">Second Paragraph</Label>
                <textarea
                  id="about_description_2"
                  value={content.about_description_2 || ""}
                  onChange={(e) =>
                    updateField("about_description_2", e.target.value)
                  }
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <Separator />
              <h3 className="font-medium">Feature Cards</h3>
              <p className="text-sm text-muted-foreground -mt-4">
                Four feature cards displayed in the About section. Icons:
                Heart, Camera, MapPin, Clock.
              </p>
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="grid sm:grid-cols-[120px_1fr_1fr] gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <select
                      value={content[`about_feature_${n}_icon`] || "Heart"}
                      onChange={(e) =>
                        updateField(`about_feature_${n}_icon`, e.target.value)
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Heart">Heart</option>
                      <option value="Camera">Camera</option>
                      <option value="MapPin">MapPin</option>
                      <option value="Clock">Clock</option>
                      <option value="Star">Star</option>
                      <option value="Award">Award</option>
                      <option value="Users">Users</option>
                      <option value="Sparkles">Sparkles</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={content[`about_feature_${n}_title`] || ""}
                      onChange={(e) =>
                        updateField(
                          `about_feature_${n}_title`,
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={content[`about_feature_${n}_description`] || ""}
                      onChange={(e) =>
                        updateField(
                          `about_feature_${n}_description`,
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Portfolio Section ─── */}
        <TabsContent value="portfolio" className="space-y-6 mt-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            )}
            {isDragActive ? (
              <p className="text-lg font-medium">Drop photos here</p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Drag & drop photos here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  These photos will appear in the Portfolio section on your
                  landing page
                </p>
              </>
            )}
          </div>

          {photosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold">
                  No listing media yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload photos using the area above to showcase your work
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square">
                  <Image
                    src={photo.url}
                    alt={photo.caption || photo.filename}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        setEditingPhoto(photo);
                        setEditCaption(photo.caption || "");
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 rounded-b-lg">
                      <p className="text-white text-xs truncate">
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Contact Section ─── */}
        <TabsContent value="contact" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Contact Section</h2>
              <p className="text-sm text-muted-foreground">
                How visitors can reach you
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_label">Section Label</Label>
                  <Input
                    id="contact_label"
                    value={content.contact_label || ""}
                    onChange={(e) =>
                      updateField("contact_label", e.target.value)
                    }
                    placeholder="Let's Connect"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_title">Title</Label>
                  <Input
                    id="contact_title"
                    value={content.contact_title || ""}
                    onChange={(e) =>
                      updateField("contact_title", e.target.value)
                    }
                    placeholder="Get in Touch"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_description">Description</Label>
                <textarea
                  id="contact_description"
                  value={content.contact_description || ""}
                  onChange={(e) =>
                    updateField("contact_description", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email Address</Label>
                  <Input
                    id="contact_email"
                    value={content.contact_email || ""}
                    onChange={(e) =>
                      updateField("contact_email", e.target.value)
                    }
                    placeholder="hello@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone / WhatsApp</Label>
                  <Input
                    id="contact_phone"
                    value={content.contact_phone || ""}
                    onChange={(e) =>
                      updateField("contact_phone", e.target.value)
                    }
                    placeholder="+52 646 XXX XXXX"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone_href">
                    WhatsApp Link (wa.me URL)
                  </Label>
                  <Input
                    id="contact_phone_href"
                    value={content.contact_phone_href || ""}
                    onChange={(e) =>
                      updateField("contact_phone_href", e.target.value)
                    }
                    placeholder="https://wa.me/521234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_location">Location</Label>
                  <Input
                    id="contact_location"
                    value={content.contact_location || ""}
                    onChange={(e) =>
                      updateField("contact_location", e.target.value)
                    }
                    placeholder="Ensenada, Baja California"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_note">Additional Note</Label>
                <textarea
                  id="contact_note"
                  value={content.contact_note || ""}
                  onChange={(e) =>
                    updateField("contact_note", e.target.value)
                  }
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Brand & Social ─── */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Logo & Brand</h2>
              <p className="text-sm text-muted-foreground">
                Your logo, brand name, location, and social media links shown in
                the navbar and footer
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={content.brand_name || ""}
                    onChange={(e) =>
                      updateField("brand_name", e.target.value)
                    }
                    placeholder="Diericks"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_subtitle">Brand Subtitle</Label>
                  <Input
                    id="brand_subtitle"
                    value={content.brand_subtitle || ""}
                    onChange={(e) =>
                      updateField("brand_subtitle", e.target.value)
                    }
                    placeholder="Realty"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_logo_url">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_logo_url"
                      value={content.brand_logo_url || ""}
                      onChange={(e) =>
                        updateField("brand_logo_url", e.target.value)
                      }
                      placeholder="https://..."
                    />
                    <BlobUploadButton
                      folder="brand"
                      accept="image/*"
                      label="Upload Logo"
                      onUploaded={(url) => updateField("brand_logo_url", url)}
                    />
                  </div>
                  {content.brand_logo_url && (
                    <div className="relative h-16 w-48 overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={content.brand_logo_url}
                        alt="Logo preview"
                        fill
                        className="object-contain p-2"
                        sizes="192px"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand_logo_width">Logo Width (px)</Label>
                    <Input
                      id="brand_logo_width"
                      value={content.brand_logo_width || ""}
                      onChange={(e) =>
                        updateField("brand_logo_width", e.target.value)
                      }
                      placeholder="40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_logo_height">Logo Height (px)</Label>
                    <Input
                      id="brand_logo_height"
                      value={content.brand_logo_height || ""}
                      onChange={(e) =>
                        updateField("brand_logo_height", e.target.value)
                      }
                      placeholder="40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_logo_radius">Logo Radius</Label>
                    <Input
                      id="brand_logo_radius"
                      value={content.brand_logo_radius || ""}
                      onChange={(e) =>
                        updateField("brand_logo_radius", e.target.value)
                      }
                      placeholder="0.25rem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_logo_padding">Logo Padding</Label>
                    <Input
                      id="brand_logo_padding"
                      value={content.brand_logo_padding || ""}
                      onChange={(e) =>
                        updateField("brand_logo_padding", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="brand_logo_background">
                      Logo Background
                    </Label>
                    <Input
                      id="brand_logo_background"
                      value={content.brand_logo_background || ""}
                      onChange={(e) =>
                        updateField("brand_logo_background", e.target.value)
                      }
                      placeholder="rgba(255, 255, 255, 0.8)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_favicon_url">Favicon URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_favicon_url"
                      value={content.brand_favicon_url || ""}
                      onChange={(e) =>
                        updateField("brand_favicon_url", e.target.value)
                      }
                      placeholder="/favicon.ico"
                    />
                    <BlobUploadButton
                      folder="brand"
                      accept="image/*"
                      label="Upload Favicon"
                      onUploaded={(url) => updateField("brand_favicon_url", url)}
                    />
                  </div>
                  {content.brand_favicon_url && (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={content.brand_favicon_url}
                        alt="Favicon preview"
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="brand_header_show_text">
                    Show Header Brand Text
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Turn this off for logo-only header branding.
                  </p>
                </div>
                <Switch
                  id="brand_header_show_text"
                  checked={content.brand_header_show_text !== "false"}
                  onCheckedChange={(checked) =>
                    updateField(
                      "brand_header_show_text",
                      checked ? "true" : "false"
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_location">
                  Footer Location
                </Label>
                <Input
                  id="footer_location"
                  value={content.footer_location || ""}
                  onChange={(e) =>
                    updateField("footer_location", e.target.value)
                  }
                  placeholder="Ensenada, Baja California"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_description">Footer Description</Label>
                <textarea
                  id="footer_description"
                  value={content.footer_description || ""}
                  onChange={(e) =>
                    updateField("footer_description", e.target.value)
                  }
                  rows={3}
                  placeholder="Short business description shown under your logo."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <Separator />
              <h3 className="font-medium">Global Agent Profile</h3>
              <p className="text-sm text-muted-foreground -mt-4">
                Used on every public listing detail page.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Agent Name</Label>
                  <Input
                    id="agent_name"
                    value={content.agent_name || ""}
                    onChange={(e) => updateField("agent_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_title">Agent Title</Label>
                  <Input
                    id="agent_title"
                    value={content.agent_title || ""}
                    onChange={(e) => updateField("agent_title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_email">Agent Email</Label>
                  <Input
                    id="agent_email"
                    type="email"
                    value={content.agent_email || ""}
                    onChange={(e) => updateField("agent_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_phone">Agent Phone</Label>
                  <Input
                    id="agent_phone"
                    value={content.agent_phone || ""}
                    onChange={(e) => updateField("agent_phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_whatsapp">Agent WhatsApp URL</Label>
                  <Input
                    id="agent_whatsapp"
                    value={content.agent_whatsapp || ""}
                    onChange={(e) => updateField("agent_whatsapp", e.target.value)}
                    placeholder="https://wa.me/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_photo_url">Agent Photo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="agent_photo_url"
                      value={content.agent_photo_url || ""}
                      onChange={(e) =>
                        updateField("agent_photo_url", e.target.value)
                      }
                      placeholder="https://..."
                    />
                    <BlobUploadButton
                      folder="agents"
                      accept="image/*"
                      label="Upload"
                      onUploaded={(url) => updateField("agent_photo_url", url)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent_bio">Agent Bio</Label>
                <textarea
                  id="agent_bio"
                  value={content.agent_bio || ""}
                  onChange={(e) => updateField("agent_bio", e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe the agent's experience, market focus, and client approach."
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_area_served">Areas Served</Label>
                  <Input
                    id="agent_area_served"
                    value={content.agent_area_served || ""}
                    onChange={(e) => updateField("agent_area_served", e.target.value)}
                    placeholder="Ensenada, Valle de Guadalupe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_specialties">Specialties</Label>
                  <Input
                    id="agent_specialties"
                    value={content.agent_specialties || ""}
                    onChange={(e) => updateField("agent_specialties", e.target.value)}
                    placeholder="Land investment, seller strategy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_slug">Agent Page Slug</Label>
                  <Input
                    id="agent_slug"
                    value={content.agent_slug || ""}
                    onChange={(e) => updateField("agent_slug", e.target.value)}
                    placeholder="eric-becerra"
                  />
                </div>
              </div>
              <Separator />
              <h3 className="font-medium">Social Media Links</h3>
              <p className="text-sm text-muted-foreground -mt-4">
                Leave blank to hide a social icon
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_instagram">Instagram URL</Label>
                  <Input
                    id="social_instagram"
                    value={content.social_instagram || ""}
                    onChange={(e) =>
                      updateField("social_instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_facebook">Facebook URL</Label>
                  <Input
                    id="social_facebook"
                    value={content.social_facebook || ""}
                    onChange={(e) =>
                      updateField("social_facebook", e.target.value)
                    }
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_tiktok">TikTok URL</Label>
                  <Input
                    id="social_tiktok"
                    value={content.social_tiktok || ""}
                    onChange={(e) =>
                      updateField("social_tiktok", e.target.value)
                    }
                    placeholder="https://tiktok.com/@yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_youtube">YouTube URL</Label>
                  <Input
                    id="social_youtube"
                    value={content.social_youtube || ""}
                    onChange={(e) =>
                      updateField("social_youtube", e.target.value)
                    }
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                  <Input
                    id="social_linkedin"
                    value={content.social_linkedin || ""}
                    onChange={(e) =>
                      updateField("social_linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_whatsapp">WhatsApp URL</Label>
                  <Input
                    id="social_whatsapp"
                    value={content.social_whatsapp || ""}
                    onChange={(e) =>
                      updateField("social_whatsapp", e.target.value)
                    }
                    placeholder="https://wa.me/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SEO & Meta ─── */}
        <TabsContent value="seo" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">SEO & Meta Settings</h2>
              <p className="text-sm text-muted-foreground">
                Control page titles, descriptions, social previews, keywords,
                and search verification tags.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_site_url">Site URL</Label>
                  <Input
                    id="seo_site_url"
                    value={content.seo_site_url || ""}
                    onChange={(e) => updateField("seo_site_url", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_site_name">Site Name</Label>
                  <Input
                    id="seo_site_name"
                    value={content.seo_site_name || ""}
                    onChange={(e) => updateField("seo_site_name", e.target.value)}
                    placeholder="Diericks Realty"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_title_template">Title Template</Label>
                <Input
                  id="seo_title_template"
                  value={content.seo_title_template || ""}
                  onChange={(e) =>
                    updateField("seo_title_template", e.target.value)
                  }
                  placeholder="%s | Diericks Realty"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code>%s</code> where the page title should appear.
                </p>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Homepage</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_home_title">Homepage Title</Label>
                    <Input
                      id="seo_home_title"
                      value={content.seo_home_title || ""}
                      onChange={(e) =>
                        updateField("seo_home_title", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_home_og_title">Homepage OG Title</Label>
                    <Input
                      id="seo_home_og_title"
                      value={content.seo_home_og_title || ""}
                      onChange={(e) =>
                        updateField("seo_home_og_title", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_home_description">
                    Homepage Description
                  </Label>
                  <textarea
                    id="seo_home_description"
                    value={content.seo_home_description || ""}
                    onChange={(e) =>
                      updateField("seo_home_description", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Listings Page</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_listings_title">Listings Title</Label>
                    <Input
                      id="seo_listings_title"
                      value={content.seo_listings_title || ""}
                      onChange={(e) =>
                        updateField("seo_listings_title", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_listings_og_title">
                      Listings OG Title
                    </Label>
                    <Input
                      id="seo_listings_og_title"
                      value={content.seo_listings_og_title || ""}
                      onChange={(e) =>
                        updateField("seo_listings_og_title", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_listings_description">
                    Listings Description
                  </Label>
                  <textarea
                    id="seo_listings_description"
                    value={content.seo_listings_description || ""}
                    onChange={(e) =>
                      updateField("seo_listings_description", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Marketing Integrations</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marketing_google_analytics_id">
                      Google Analytics ID
                    </Label>
                    <Input
                      id="marketing_google_analytics_id"
                      value={content.marketing_google_analytics_id || ""}
                      onChange={(e) =>
                        updateField("marketing_google_analytics_id", e.target.value)
                      }
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marketing_meta_pixel_id">Meta Pixel ID</Label>
                    <Input
                      id="marketing_meta_pixel_id"
                      value={content.marketing_meta_pixel_id || ""}
                      onChange={(e) =>
                        updateField("marketing_meta_pixel_id", e.target.value)
                      }
                      placeholder="1234567890"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marketing_google_tag_manager_id">
                      Google Tag Manager ID
                    </Label>
                    <Input
                      id="marketing_google_tag_manager_id"
                      value={content.marketing_google_tag_manager_id || ""}
                      onChange={(e) =>
                        updateField("marketing_google_tag_manager_id", e.target.value)
                      }
                      placeholder="GTM-XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marketing_google_ads_id">
                      Google Ads Conversion ID
                    </Label>
                    <Input
                      id="marketing_google_ads_id"
                      value={content.marketing_google_ads_id || ""}
                      onChange={(e) =>
                        updateField("marketing_google_ads_id", e.target.value)
                      }
                      placeholder="AW-XXXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marketing_google_ads_label">
                      Google Ads Lead Label
                    </Label>
                    <Input
                      id="marketing_google_ads_label"
                      value={content.marketing_google_ads_label || ""}
                      onChange={(e) =>
                        updateField("marketing_google_ads_label", e.target.value)
                      }
                      placeholder="abc123ConversionLabel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_bing_verification">
                      Bing Webmaster Verification
                    </Label>
                    <Input
                      id="seo_bing_verification"
                      value={content.seo_bing_verification || ""}
                      onChange={(e) =>
                        updateField("seo_bing_verification", e.target.value)
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Cookie Consent</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="privacy_cookie_consent_enabled">
                        Enable Consent Banner
                      </Label>
                      <select
                        id="privacy_cookie_consent_enabled"
                        value={content.privacy_cookie_consent_enabled || "true"}
                        onChange={(e) =>
                          updateField("privacy_cookie_consent_enabled", e.target.value)
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="privacy_cookie_consent_button">
                        Consent Button Text
                      </Label>
                      <Input
                        id="privacy_cookie_consent_button"
                        value={content.privacy_cookie_consent_button || ""}
                        onChange={(e) =>
                          updateField("privacy_cookie_consent_button", e.target.value)
                        }
                        placeholder="Accept"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="privacy_cookie_consent_text">
                      Consent Banner Text
                    </Label>
                    <textarea
                      id="privacy_cookie_consent_text"
                      value={content.privacy_cookie_consent_text || ""}
                      onChange={(e) =>
                        updateField("privacy_cookie_consent_text", e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marketing_whatsapp_url">
                      Floating WhatsApp URL
                    </Label>
                    <Input
                      id="marketing_whatsapp_url"
                      value={content.marketing_whatsapp_url || ""}
                      onChange={(e) =>
                        updateField("marketing_whatsapp_url", e.target.value)
                      }
                      placeholder="https://wa.me/52646XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marketing_whatsapp_label">
                      WhatsApp Button Label
                    </Label>
                    <Input
                      id="marketing_whatsapp_label"
                      value={content.marketing_whatsapp_label || ""}
                      onChange={(e) =>
                        updateField("marketing_whatsapp_label", e.target.value)
                      }
                      placeholder="WhatsApp"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Social Preview & Search</h3>
                <div className="space-y-2">
                  <Label htmlFor="seo_og_image">Open Graph Image URL</Label>
                  <Input
                    id="seo_og_image"
                    value={content.seo_og_image || ""}
                    onChange={(e) => updateField("seo_og_image", e.target.value)}
                    placeholder="/og-image.jpg"
                  />
                  <BlobUploadButton
                    folder="website"
                    accept="image/*"
                    label="Upload OG Image"
                    onUploaded={(url) => updateField("seo_og_image", url)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">Keywords</Label>
                  <textarea
                    id="seo_keywords"
                    value={content.seo_keywords || ""}
                    onChange={(e) => updateField("seo_keywords", e.target.value)}
                    rows={3}
                    placeholder="real estate, homes, buyer representation"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_google_verification">
                      Google Verification
                    </Label>
                    <Input
                      id="seo_google_verification"
                      value={content.seo_google_verification || ""}
                      onChange={(e) =>
                        updateField("seo_google_verification", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_yandex_verification">
                      Yandex Verification
                    </Label>
                    <Input
                      id="seo_yandex_verification"
                      value={content.seo_yandex_verification || ""}
                      onChange={(e) =>
                        updateField("seo_yandex_verification", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Legal Pages ─── */}
        <TabsContent value="legal" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Legal Pages</h2>
              <p className="text-sm text-muted-foreground">
                Manage Privacy Policy, Terms of Service, sitemap footer links,
                and copyright text.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="legal_privacy_content">Privacy Policy</Label>
                <textarea
                  id="legal_privacy_content"
                  value={content.legal_privacy_content || ""}
                  onChange={(e) =>
                    updateField("legal_privacy_content", e.target.value)
                  }
                  rows={10}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_terms_content">Terms of Service</Label>
                <textarea
                  id="legal_terms_content"
                  value={content.legal_terms_content || ""}
                  onChange={(e) =>
                    updateField("legal_terms_content", e.target.value)
                  }
                  rows={10}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_accessibility_content">
                  Accessibility Statement
                </Label>
                <textarea
                  id="legal_accessibility_content"
                  value={content.legal_accessibility_content || ""}
                  onChange={(e) =>
                    updateField("legal_accessibility_content", e.target.value)
                  }
                  rows={8}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="footer_copyright">Footer Copyright Text</Label>
                <Input
                  id="footer_copyright"
                  value={content.footer_copyright || ""}
                  onChange={(e) => updateField("footer_copyright", e.target.value)}
                  placeholder="All rights reserved."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="footer_accessibility_url">
                    Accessibility URL
                  </Label>
                  <Input
                    id="footer_accessibility_url"
                    value={content.footer_accessibility_url || ""}
                    onChange={(e) =>
                      updateField("footer_accessibility_url", e.target.value)
                    }
                    placeholder="/accessibility"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="footer_show_accessibility_link">
                    Accessibility Link
                  </Label>
                  <Switch
                    id="footer_show_accessibility_link"
                    checked={content.footer_show_accessibility_link !== "false"}
                    onCheckedChange={(checked) =>
                      updateField(
                        "footer_show_accessibility_link",
                        checked ? "true" : "false"
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Theme ─── */}
        <TabsContent value="theme" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Theme & Styling</h2>
              <p className="text-sm text-muted-foreground">
                Control site-wide design tokens plus section-specific colors.
                Use CSS color values such as <code>#111827</code>,{" "}
                <code>white</code>, or <code>oklch(...)</code>.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <h3 className="font-medium">Header Logo</h3>
                <p className="text-sm text-muted-foreground">
                  These match the logo controls in Brand & Header and affect the
                  public navigation bar.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["brand_logo_width", "Logo Width (px)"],
                    ["brand_logo_height", "Logo Height (px)"],
                    ["brand_logo_radius", "Logo Radius"],
                    ["brand_logo_padding", "Logo Padding"],
                    ["brand_logo_background", "Logo Background"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={`theme_${key}`}>{label}</Label>
                      <Input
                        id={`theme_${key}`}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="theme_brand_header_show_text">
                      Show Header Brand Text
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Turn this off for logo-only header branding.
                    </p>
                  </div>
                  <Switch
                    id="theme_brand_header_show_text"
                    checked={content.brand_header_show_text !== "false"}
                    onCheckedChange={(checked) =>
                      updateField(
                        "brand_header_show_text",
                        checked ? "true" : "false"
                      )
                    }
                  />
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Site-wide</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ["theme_background", "Background"],
                    ["theme_foreground", "Text"],
                    ["theme_primary", "Primary"],
                    ["theme_primary_foreground", "Primary Text"],
                    ["theme_secondary", "Secondary"],
                    ["theme_secondary_foreground", "Secondary Text"],
                    ["theme_muted", "Muted Background"],
                    ["theme_muted_foreground", "Muted Text"],
                    ["theme_card", "Card Background"],
                    ["theme_card_foreground", "Card Text"],
                    ["theme_border", "Border"],
                    ["theme_input", "Input Border"],
                    ["theme_ring", "Focus Ring"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder="#111827"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme_radius">Border Radius</Label>
                    <Input
                      id="theme_radius"
                      value={content.theme_radius || ""}
                      onChange={(e) => updateField("theme_radius", e.target.value)}
                      placeholder="0.625rem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme_font_sans">Sans Font Stack</Label>
                    <Input
                      id="theme_font_sans"
                      value={content.theme_font_sans || ""}
                      onChange={(e) => updateField("theme_font_sans", e.target.value)}
                      placeholder="Inter, system-ui, sans-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme_font_heading">Heading Font Stack</Label>
                    <Input
                      id="theme_font_heading"
                      value={content.theme_font_heading || ""}
                      onChange={(e) => updateField("theme_font_heading", e.target.value)}
                      placeholder="Inter, system-ui, sans-serif"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Buttons</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["theme_button_radius", "Button Radius"],
                    ["theme_button_bg", "Button Background"],
                    ["theme_button_text", "Button Text"],
                    ["theme_button_hover_bg", "Button Hover Background"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Header</h3>
                <p className="text-sm text-muted-foreground">
                  Top state applies before scrolling. Scrolled state applies
                  after the public homepage header becomes sticky/solid and is
                  also used on pages that always show a solid header.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["theme_header_transparent_bg", "Top Header Background"],
                    ["theme_header_transparent_text", "Top Header Text"],
                    ["theme_header_bg", "Scrolled Header Background"],
                    ["theme_header_text", "Scrolled Header Text"],
                    ["theme_header_border", "Scrolled Header Border"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-medium">Hero</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["theme_hero_overlay", "Hero Overlay"],
                    ["theme_hero_text", "Hero Text"],
                    ["theme_hero_muted_text", "Hero Muted Text"],
                    ["theme_hero_button_bg", "Hero Button Background"],
                    ["theme_hero_button_text", "Hero Button Text"],
                    ["theme_hero_secondary_button_border", "Secondary Button Border"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Footer</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["theme_footer_bg", "Footer Background"],
                    ["theme_footer_text", "Footer Text"],
                    ["theme_footer_muted_text", "Footer Muted Text"],
                    ["theme_footer_border", "Footer Border"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Footer Social Icons</h3>
                <p className="text-sm text-muted-foreground">
                  Controls the circular social media buttons in the footer.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["theme_footer_social_bg", "Icon Background"],
                    ["theme_footer_social_color", "Icon Color"],
                    ["theme_footer_social_hover_bg", "Hover Background"],
                    ["theme_footer_social_hover_color", "Hover Icon Color"],
                    ["theme_footer_social_radius", "Button Radius"],
                    ["theme_footer_social_size", "Button Size"],
                    ["theme_footer_social_icon_size", "Icon Size"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Sections</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["theme_section_bg", "Default Section Background"],
                    ["theme_section_text", "Default Section Text"],
                    ["theme_about_background", "About Section Background"],
                    ["theme_contact_background", "Contact Section Background"],
                    ["theme_card_radius", "Card Radius"],
                  ].map(([key, label]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={content[key] || ""}
                        onChange={(e) => updateField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Translate & Currency ─── */}
        <TabsContent value="translation" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Translation & Currency</h2>
              <p className="text-sm text-muted-foreground">
                Enable automatic site translation and configure the USD/MXN
                price toggle shown on public listing cards and detail pages.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="translation_google_enabled">
                      Google Translate Widget
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Shows a floating language selector for automatic Spanish
                      translation.
                    </p>
                  </div>
                  <Switch
                    id="translation_google_enabled"
                    checked={content.translation_google_enabled !== "false"}
                    onCheckedChange={(checked) =>
                      updateField(
                        "translation_google_enabled",
                        checked ? "true" : "false"
                      )
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="translation_google_languages">
                      Included Languages
                    </Label>
                    <Input
                      id="translation_google_languages"
                      value={content.translation_google_languages || ""}
                      onChange={(e) =>
                        updateField(
                          "translation_google_languages",
                          e.target.value
                        )
                      }
                      placeholder="en,es"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated Google Translate language codes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="translation_widget_label">
                      Widget Label
                    </Label>
                    <Input
                      id="translation_widget_label"
                      value={content.translation_widget_label || ""}
                      onChange={(e) =>
                        updateField("translation_widget_label", e.target.value)
                      }
                      placeholder="Translate"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="currency_switch_enabled">
                      Listing Currency Toggle
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Lets visitors switch displayed listing prices between USD
                      and MXN.
                    </p>
                  </div>
                  <Switch
                    id="currency_switch_enabled"
                    checked={content.currency_switch_enabled !== "false"}
                    onCheckedChange={(checked) =>
                      updateField(
                        "currency_switch_enabled",
                        checked ? "true" : "false"
                      )
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency_usd_to_mxn_rate">
                      USD to MXN Exchange Rate
                    </Label>
                    <Input
                      id="currency_usd_to_mxn_rate"
                      value={content.currency_usd_to_mxn_rate || ""}
                      onChange={(e) =>
                        updateField("currency_usd_to_mxn_rate", e.target.value)
                      }
                      placeholder="17.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency_default_display">
                      Default Display Currency
                    </Label>
                    <select
                      id="currency_default_display"
                      value={content.currency_default_display || "listing"}
                      onChange={(e) =>
                        updateField("currency_default_display", e.target.value)
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="listing">Use each listing currency</option>
                      <option value="USD">Show USD first</option>
                      <option value="MXN">Show MXN first</option>
                    </select>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Accessibility ─── */}
        <TabsContent value="accessibility" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Accessibility</h2>
              <p className="text-sm text-muted-foreground">
                Configure keyboard navigation aids and accessibility helpers.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="accessibility_skip_links_enabled">
                      Enable Skip Links
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Adds keyboard-accessible links to jump to main content and footer.
                    </p>
                  </div>
                  <Switch
                    id="accessibility_skip_links_enabled"
                    checked={content.accessibility_skip_links_enabled !== "false"}
                    onCheckedChange={(checked) =>
                      updateField(
                        "accessibility_skip_links_enabled",
                        checked ? "true" : "false"
                      )
                    }
                  />
                </div>
              </section>
              <Separator />
              <section className="space-y-4">
                <h3 className="font-medium">Readable Experience</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_text_scale">Text Size</Label>
                    <select
                      id="accessibility_text_scale"
                      value={content.accessibility_text_scale || "normal"}
                      onChange={(e) => updateField("accessibility_text_scale", e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="large">Large</option>
                      <option value="x-large">Extra large</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_focus_ring_color">Focus Ring Color</Label>
                    <Input
                      id="accessibility_focus_ring_color"
                      value={content.accessibility_focus_ring_color || ""}
                      onChange={(e) => updateField("accessibility_focus_ring_color", e.target.value)}
                      placeholder="#2563eb"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_focus_ring_width">Focus Ring Width</Label>
                    <Input
                      id="accessibility_focus_ring_width"
                      value={content.accessibility_focus_ring_width || ""}
                      onChange={(e) => updateField("accessibility_focus_ring_width", e.target.value)}
                      placeholder="3px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_focus_ring_offset">Focus Ring Offset</Label>
                    <Input
                      id="accessibility_focus_ring_offset"
                      value={content.accessibility_focus_ring_offset || ""}
                      onChange={(e) => updateField("accessibility_focus_ring_offset", e.target.value)}
                      placeholder="3px"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="accessibility_underline_links">
                      Always Underline Links
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Makes text links easier to identify across the public site.
                    </p>
                  </div>
                  <Switch
                    id="accessibility_underline_links"
                    checked={content.accessibility_underline_links === "true"}
                    onCheckedChange={(checked) =>
                      updateField("accessibility_underline_links", checked ? "true" : "false")
                    }
                  />
                </div>
              </section>
              <Separator />
              <section className="space-y-4">
                <h3 className="font-medium">Accessibility Statement</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_statement_title">Page Title</Label>
                    <Input
                      id="accessibility_statement_title"
                      value={content.accessibility_statement_title || ""}
                      onChange={(e) => updateField("accessibility_statement_title", e.target.value)}
                      placeholder="Accessibility Statement"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer_accessibility_url">Footer Link URL</Label>
                    <Input
                      id="footer_accessibility_url"
                      value={content.footer_accessibility_url || ""}
                      onChange={(e) => updateField("footer_accessibility_url", e.target.value)}
                      placeholder="/accessibility"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="footer_show_accessibility_link">
                      Show Accessibility Link in Footer
                    </Label>
                  </div>
                  <Switch
                    id="footer_show_accessibility_link"
                    checked={content.footer_show_accessibility_link !== "false"}
                    onCheckedChange={(checked) =>
                      updateField("footer_show_accessibility_link", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessibility_statement_content">
                    Statement HTML
                  </Label>
                  <textarea
                    id="accessibility_statement_content"
                    value={content.accessibility_statement_content || ""}
                    onChange={(e) =>
                      updateField("accessibility_statement_content", e.target.value)
                    }
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Announcements ─── */}
        <TabsContent value="announcements" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Announcements</h2>
              <p className="text-sm text-muted-foreground">
                Configure minor header banners and major site-wide dialogs.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <h3 className="font-medium">Minor Announcement</h3>
                <p className="text-sm text-muted-foreground">
                  Shows as a simple fixed banner under the header.
                </p>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <Label htmlFor="announcement_minor_enabled">Enable Minor Announcement</Label>
                  <Switch
                    id="announcement_minor_enabled"
                    checked={content.announcement_minor_enabled === "true"}
                    onCheckedChange={(checked) =>
                      updateField("announcement_minor_enabled", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement_minor_text">Minor Announcement Text</Label>
                  <Input
                    id="announcement_minor_text"
                    value={content.announcement_minor_text || ""}
                    onChange={(e) => updateField("announcement_minor_text", e.target.value)}
                    placeholder="New listings just launched in Baja California."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="announcement_minor_link_label">Optional Link Label</Label>
                    <Input
                      id="announcement_minor_link_label"
                      value={content.announcement_minor_link_label || ""}
                      onChange={(e) =>
                        updateField("announcement_minor_link_label", e.target.value)
                      }
                      placeholder="View listings"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="announcement_minor_link_url">Optional Link URL</Label>
                    <Input
                      id="announcement_minor_link_url"
                      value={content.announcement_minor_link_url || ""}
                      onChange={(e) =>
                        updateField("announcement_minor_link_url", e.target.value)
                      }
                      placeholder="/listings"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="font-medium">Major Announcement</h3>
                <p className="text-sm text-muted-foreground">
                  Shows as a closable dialog. Visitors will not see the same ID again after closing it.
                </p>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <Label htmlFor="announcement_major_enabled">Enable Major Announcement</Label>
                  <Switch
                    id="announcement_major_enabled"
                    checked={content.announcement_major_enabled === "true"}
                    onCheckedChange={(checked) =>
                      updateField("announcement_major_enabled", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="announcement_major_id">Announcement ID</Label>
                    <Input
                      id="announcement_major_id"
                      value={content.announcement_major_id || ""}
                      onChange={(e) => updateField("announcement_major_id", e.target.value)}
                      placeholder="spring-2026"
                    />
                    <p className="text-xs text-muted-foreground">
                      Change this ID when you want closed dialogs to show again.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="announcement_major_button_label">Close Button Label</Label>
                    <Input
                      id="announcement_major_button_label"
                      value={content.announcement_major_button_label || ""}
                      onChange={(e) =>
                        updateField("announcement_major_button_label", e.target.value)
                      }
                      placeholder="Close"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement_major_title">Major Announcement Title</Label>
                  <Input
                    id="announcement_major_title"
                    value={content.announcement_major_title || ""}
                    onChange={(e) => updateField("announcement_major_title", e.target.value)}
                    placeholder="Important update"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement_major_content">
                    Major Announcement HTML
                  </Label>
                  <textarea
                    id="announcement_major_content"
                    value={content.announcement_major_content || ""}
                    onChange={(e) =>
                      updateField("announcement_major_content", e.target.value)
                    }
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="<p>Share a major update with visitors.</p>"
                  />
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
            <DialogDescription>
              Add a caption that will be shown when hovering over this photo
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Enter caption..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhoto(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
