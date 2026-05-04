"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewClientPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [packageType, setPackageType] = useState("buyer");
  const [projectStatus, setProjectStatus] = useState("Curating properties");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          packageType,
          projectStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create client");
      }

      const client = await response.json();
      toast.success("Client created successfully");
      router.push(`/admin/clients/${client.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Client</h1>
          <p className="text-muted-foreground">
            Create a buyer or seller client workspace
          </p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
          <CardDescription>
            Set up client access and the initial communication workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lakeside homes for the Ramirez family"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                disabled={isLoading}
              />
              <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  If you add an email, the contact can log in directly at{" "}
                  <code className="bg-muted px-1 rounded">/login</code> using their email and password.
                  Clients access their portal only through the login dashboard.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageType">Client Type</Label>
              <select
                id="packageType"
                value={packageType}
                onChange={(event) => {
                  const value = event.target.value;
                  setPackageType(value);
                  setProjectStatus(
                    value === "seller" ? "Preparing listing" : "Curating properties"
                  );
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={isLoading}
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Buyers receive a curated private property experience. Sellers receive listing status and interest updates.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectStatus">Initial Status</Label>
              <Input
                id="projectStatus"
                value={projectStatus}
                onChange={(event) => setProjectStatus(event.target.value)}
                placeholder="Curating properties, preparing listing, live on market..."
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  disabled={isLoading}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This password is used for the client login dashboard.
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Client"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/clients">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
