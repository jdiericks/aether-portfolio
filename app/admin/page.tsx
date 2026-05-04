import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FileText, Home, ImageIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const [clientCount, listingCount, photoCount, portfolioCount] = await Promise.all([
    prisma.client.count(),
    prisma.listing.count(),
    prisma.photo.count(),
    prisma.portfolioPhoto.count(),
  ]);

  const [recentListings, recentClients] = await Promise.all([
    prisma.listing.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { photos: true },
      },
    },
    }),
  ]);

  return { clientCount, listingCount, photoCount, portfolioCount, recentListings, recentClients };
}

export default async function AdminDashboard() {
  const { clientCount, listingCount, photoCount, portfolioCount, recentListings, recentClients } = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your real estate website
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Assets</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photoCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Listing Images</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Public Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {recentListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No public properties yet.{" "}
              <Link href="/admin/listings" className="text-primary hover:underline">
                Add your first property
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {recentListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <Link
                      href="/admin/listings"
                      className="font-medium hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clients yet.{" "}
              <Link href="/admin/clients/new" className="text-primary hover:underline">
                Add your first client
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-medium hover:underline"
                    >
                      {client.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {client._count.photos} assets
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
