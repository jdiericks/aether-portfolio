import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function getClients() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { photos: true, listings: true },
      },
    },
  });
}

export default async function ClientsPage() {
  const clients = await getClients();
  const buyers = clients.filter((client) => client.packageType !== "seller");
  const sellers = clients.filter((client) => client.packageType === "seller");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage buyer curation and seller listing communication
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <h3 className="text-lg font-semibold">No clients yet</h3>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first buyer or seller client
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          <ClientTable
            title="Buyers"
            description="Private curated property recommendations and buying notes."
            clients={buyers}
            emptyText="No buyer clients yet."
          />
          <ClientTable
            title="Sellers"
            description="Read-only listing status, interest summaries, and seller updates."
            clients={sellers}
            emptyText="No seller clients yet."
          />
        </div>
      )}
    </div>
  );
}

type ClientWithCounts = Awaited<ReturnType<typeof getClients>>[number];

function ClientTable({
  title,
  description,
  clients,
  emptyText,
}: {
  title: string;
  description: string;
  clients: ClientWithCounts[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Project Status</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Portal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-medium hover:underline"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email || "—"}
                  </TableCell>
                  <TableCell>{client.projectStatus}</TableCell>
                  <TableCell>{client._count.listings}</TableCell>
                  <TableCell>{client._count.photos}</TableCell>
                  <TableCell>
                    <Badge variant={client.isActive ? "default" : "secondary"}>
                      {client.isActive ? "Login enabled" : "Disabled"}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Clients access via /login
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
