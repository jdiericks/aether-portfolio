"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Home, ImageIcon, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Lightbox } from "@/components/gallery/lightbox";
import { trackEvent } from "@/lib/tracking-client";

interface Photo {
  id: string;
  url: string;
  filename: string;
  width: number | null;
  height: number | null;
}

interface CuratedListing {
  id: string;
  note: string | null;
  order: number;
  listing: {
    id: string;
    title: string;
    slug: string;
    address: string;
    city: string | null;
    state: string | null;
    price: string;
    beds: number | null;
    baths: number | null;
    squareFeet: number | null;
    status: string;
    description: string | null;
    imageUrl: string | null;
  };
}

interface PackageInfo {
  id: string;
  name: string;
  packageType: "buyer" | "seller" | string;
  projectStatus: string;
  interestSummary: string | null;
  sellerReport: string | null;
  listings: CuratedListing[];
}

export default function ClientGalleryPage() {
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchPhotos = useCallback(async () => {
    if (!session?.user?.clientSlug) {
      setIsLoading(false);
      return;
    }

    try {
      const [photosResponse, packageResponse] = await Promise.all([
        fetch(`/api/client/photos`),
        fetch(`/api/client/package`),
      ]);
      if (photosResponse.ok) {
        setPhotos(await photosResponse.json());
      }
      if (packageResponse.ok) {
        const data = await packageResponse.json();
        setPackageInfo(data);
        trackEvent("client_dashboard_view", {
          clientId: data.id,
          packageType: data.packageType,
          listingCount: data.listings?.length || 0,
        });
      }
    } catch {
      toast.error("Failed to load media");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.clientSlug]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    fetchPhotos();
  }, [status, fetchPhotos]);

  const handleDownloadSingle = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("File downloaded");
      trackEvent("client_asset_download", {
        photoId: photo.id,
        filename: photo.filename,
      });
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleDownloadAll = async () => {
    if (photos.length === 0) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/client/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session?.user?.name || "my"}-property-media.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Property media downloaded successfully");
      trackEvent("client_asset_download_all", {
        photoCount: photos.length,
      });
    } catch {
      toast.error("Failed to download property media");
    } finally {
      setIsDownloading(false);
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
          <h1 className="text-3xl font-bold tracking-tight">
            {packageInfo?.packageType === "seller"
              ? "My Listing Status"
              : "My Curated Properties"}
          </h1>
          <p className="text-muted-foreground">
            {packageInfo?.projectStatus || "Your package is being prepared"}
          </p>
        </div>
        {photos.length > 0 && (
          <Button onClick={handleDownloadAll} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download All
              </>
            )}
          </Button>
        )}
      </div>

      {packageInfo && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  {packageInfo.packageType === "seller" ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <Home className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <h2 className="font-semibold">{packageInfo.name}</h2>
                </div>
              </div>
              {packageInfo.interestSummary && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {packageInfo.interestSummary}
                </p>
              )}
            </CardContent>
          </Card>
          {packageInfo.packageType === "seller" && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Seller update</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {packageInfo.sellerReport ||
                    "Your listing report will appear here once updates are available."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {packageInfo && packageInfo.listings.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">
              {packageInfo.packageType === "seller"
                ? "Related property"
                : "Curated properties"}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {packageInfo.listings.map((item) => (
                <a
                  key={item.id}
                  href={`/listings/${item.listing.slug}`}
                  className="overflow-hidden rounded-lg border transition-colors hover:bg-muted/40"
                  onClick={() =>
                    trackEvent("client_curated_listing_click", {
                      clientListingId: item.id,
                      listingId: item.listing.id,
                      listingSlug: item.listing.slug,
                    })
                  }
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {item.listing.imageUrl ? (
                      <Image
                        src={item.listing.imageUrl}
                        alt={`${item.listing.title} listing photo`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Listing image coming soon
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.listing.status}
                    </p>
                    <h3 className="font-medium">{item.listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[item.listing.address, item.listing.city, item.listing.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="font-semibold">{item.listing.price}</p>
                    {item.note && (
                      <p className="text-sm text-muted-foreground">{item.note}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No property media yet</h3>
            <p className="text-sm text-muted-foreground">
              Property photos and documents will appear here once they&apos;re ready
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={photo.url}
                alt={photo.filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadSingle(photo);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrevious={() =>
            setLightboxIndex((prev) => Math.max(0, (prev || 0) - 1))
          }
          onNext={() =>
            setLightboxIndex((prev) =>
              Math.min(photos.length - 1, (prev || 0) + 1)
            )
          }
        />
      )}
    </div>
  );
}
