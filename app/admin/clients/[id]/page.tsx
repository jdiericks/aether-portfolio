"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { PhotoUploader } from "@/components/admin/photo-uploader";

interface Photo {
  id: string;
  url: string;
  filename: string;
  order: number;
}

interface PackageListing {
  id: string;
  note: string | null;
  order: number;
  listing: {
    id: string;
    title: string;
    address: string;
    city: string | null;
    state: string | null;
    price: string;
    status: string;
  };
}

interface AvailableListing {
  id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  price: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  slug: string;
  packageType: string;
  projectStatus: string;
  interestSummary: string | null;
  sellerReport: string | null;
  isActive: boolean;
  photos: Photo[];
  listings: PackageListing[];
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [availableListings, setAvailableListings] = useState<AvailableListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingListings, setIsSavingListings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [packageType, setPackageType] = useState("buyer");
  const [projectStatus, setProjectStatus] = useState("Getting started");
  const [interestSummary, setInterestSummary] = useState("");
  const [sellerReport, setSellerReport] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`);
      if (!response.ok) {
        throw new Error("Client not found");
      }
      const data = await response.json();
      setClient(data);
      setName(data.name);
      setEmail(data.email || "");
      setPackageType(data.packageType || "buyer");
      setProjectStatus(data.projectStatus || "Getting started");
      setInterestSummary(data.interestSummary || "");
      setSellerReport(data.sellerReport || "");
      setIsActive(data.isActive);
      setSelectedListingIds(
        (data.listings || []).map((item: PackageListing) => item.listing.id)
      );
    } catch {
      toast.error("Failed to load client");
      router.push("/admin/clients");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch("/api/listings");
        if (!response.ok) return;
        setAvailableListings(await response.json());
      } catch {
        toast.error("Failed to load public properties");
      }
    }

    fetchListings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || null,
          password: password || undefined,
          packageType,
          projectStatus,
          interestSummary,
          sellerReport,
          isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      toast.success("Client updated successfully");
      setPassword("");
      fetchClient();
    } catch {
      toast.error("Failed to update client");
    } finally {
      setIsSaving(false);
    }
  };

  const handleListingToggle = (listingId: string, checked: boolean) => {
    setSelectedListingIds((prev) =>
      checked ? [...prev, listingId] : prev.filter((id) => id !== listingId)
    );
  };

  const handleSaveListings = async () => {
    setIsSavingListings(true);
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: selectedListingIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to update curated properties");
      }

      toast.success("Curated properties updated");
      fetchClient();
    } catch {
      toast.error("Failed to update curated properties");
    } finally {
      setIsSavingListings(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      toast.success("Client deleted successfully");
      router.push("/admin/clients");
    } catch {
      toast.error("Failed to delete client");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      toast.success("Asset deleted");
      fetchClient();
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Clients access this workspace by signing in at <code className="bg-muted px-1 rounded">/login</code>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={client.isActive ? "default" : "secondary"}>
            {client.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="photos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="photos">
            Assets ({client.photos.length})
          </TabsTrigger>
          <TabsTrigger value="listings">
            {client.packageType === "seller" ? "Listing Status" : "Curated Properties"} ({client.listings.length})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="space-y-6">
          <PhotoUploader clientId={client.id} onUploadComplete={fetchClient} />

          {client.photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No listing assets yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload listing media using the area above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {client.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square">
                  <Image
                    src={photo.url}
                    alt={photo.filename}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handlePhotoDelete(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {client.packageType === "seller" ? "Seller Listing" : "Buyer Curation"}
              </CardTitle>
              <CardDescription>
                {client.packageType === "seller"
                  ? "Attach the seller's public property and maintain read-only status updates for them."
                  : "Choose the private property recommendations visible to this buyer."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No public properties exist yet. Create properties in Admin &gt; Properties first.
                </p>
              ) : (
                <div className="space-y-3">
                  {availableListings.map((listing) => (
                    <label
                      key={listing.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedListingIds.includes(listing.id)}
                        onChange={(event) =>
                          handleListingToggle(listing.id, event.target.checked)
                        }
                      />
                      <span className="flex-1">
                        <span className="block font-medium">{listing.title}</span>
                        <span className="block text-sm text-muted-foreground">
                          {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")} · {listing.price} · {listing.status}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <Button onClick={handleSaveListings} disabled={isSavingListings}>
                {isSavingListings ? "Saving..." : "Save Client Properties"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6 max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
                <CardDescription>
                  Update this client, communication status, and access settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageType">Client Type</Label>
                  <select
                    id="packageType"
                    value={packageType}
                    onChange={(event) => setPackageType(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectStatus">Project Status</Label>
                  <Input
                    id="projectStatus"
                    value={projectStatus}
                    onChange={(event) => setProjectStatus(event.target.value)}
                    placeholder="Preparing launch, live on market, under contract..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestSummary">Interest Summary</Label>
                  <textarea
                    id="interestSummary"
                    value={interestSummary}
                    onChange={(event) => setInterestSummary(event.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Showings, saves, inquiries, feedback, next steps..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerReport">Seller Report</Label>
                  <textarea
                    id="sellerReport"
                    value={sellerReport}
                    onChange={(event) => setSellerReport(event.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Read-only seller update shown in the client dashboard."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="active">Client Portal Active</Label>
                    <p className="text-sm text-muted-foreground">
                      When disabled, this client cannot access their portal
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete this client and all private assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Client
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{client.name}&quot;? This will
              permanently delete the client and all {client.photos.length} assets.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
