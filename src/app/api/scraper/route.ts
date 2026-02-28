import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, active, stale, sourceListings, byType, byDistrict, lastUpdated] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: "active" } }),
      prisma.property.count({ where: { status: "stale" } }),
      prisma.sourceListing.groupBy({ by: ["source"], _count: true }),
      prisma.property.groupBy({
        by: ["propertyType"],
        where: { status: "active" },
        _count: true,
      }),
      prisma.property.groupBy({
        by: ["district"],
        where: { status: "active" },
        _count: true,
        orderBy: { _count: { district: "desc" } },
        take: 20,
      }),
      prisma.sourceListing.findFirst({
        orderBy: { scrapedAt: "desc" },
        select: { scrapedAt: true, source: true },
      }),
    ]);

    return NextResponse.json({
      total,
      active,
      stale,
      lastScrapedAt: lastUpdated?.scrapedAt ?? null,
      lastScrapedSource: lastUpdated?.source ?? null,
      bySource: Object.fromEntries(sourceListings.map((s) => [s.source, s._count])),
      byType: Object.fromEntries(byType.map((p) => [p.propertyType, p._count])),
      topDistricts: Object.fromEntries(byDistrict.map((d) => [d.district, d._count])),
    });
  } catch (error) {
    console.error("Scraper stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
