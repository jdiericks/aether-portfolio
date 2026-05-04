import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function topCounts(
  rows: Array<{ label: string | null; count: number }>,
  fallback = "Unknown"
) {
  return rows.map((row) => ({
    label: row.label || fallback,
    count: row.count,
  }));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = daysAgo(30);

  const [
    totalEvents,
    recentEvents,
    eventRows,
    listingRows,
    clientRows,
    inquiries,
    recent,
  ] = await Promise.all([
    prisma.trackingEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.trackingEvent.count(),
    prisma.trackingEvent.groupBy({
      by: ["eventName"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { eventName: "desc" } },
      take: 12,
    }),
    prisma.trackingEvent.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: since }, listingId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { listingId: "desc" } },
      take: 10,
    }),
    prisma.trackingEvent.groupBy({
      by: ["clientId"],
      where: { createdAt: { gte: since }, clientId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { clientId: "desc" } },
      take: 10,
    }),
    prisma.contactSubmission.count({ where: { createdAt: { gte: since } } }),
    prisma.trackingEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        eventName: true,
        path: true,
        listingId: true,
        clientId: true,
        createdAt: true,
        metadata: true,
      },
    }),
  ]);

  const clientIds = clientRows
    .map((row) => row.clientId)
    .filter((id): id is string => Boolean(id));
  const clients = clientIds.length
    ? await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, name: true, email: true, packageType: true },
      })
    : [];
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const listingIds = listingRows
    .map((row) => row.listingId)
    .filter((id): id is string => Boolean(id));
  const listings = listingIds.length
    ? await prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, title: true, slug: true },
      })
    : [];
  const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

  return NextResponse.json({
    totals: {
      allTimeEvents: recentEvents,
      last30DaysEvents: totalEvents,
      last30DaysInquiries: inquiries,
    },
    eventsByName: topCounts(
      eventRows.map((row) => ({
        label: row.eventName,
        count: row._count._all,
      }))
    ),
    topListings: listingRows.map((row) => {
      const listing = row.listingId ? listingMap.get(row.listingId) : null;
      return {
        listingId: row.listingId,
        label: listing?.title || listing?.slug || row.listingId || "Unknown",
        slug: listing?.slug,
        count: row._count._all,
      };
    }),
    topClients: clientRows.map((row) => {
      const client = row.clientId ? clientMap.get(row.clientId) : null;
      return {
        clientId: row.clientId,
        name: client?.name || row.clientId || "Unknown",
        email: client?.email,
        packageType: client?.packageType,
        count: row._count._all,
      };
    }),
    recent,
  });
}
