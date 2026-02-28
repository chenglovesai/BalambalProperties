export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { PropertyCard } from "@/components/property-card";
import { SearchFilters } from "@/components/search-filters";
import { AiChat } from "@/components/ai-chat";
import { X, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    districts?: string;
    types?: string;
    minRent?: string;
    maxRent?: string;
    minArea?: string;
    maxArea?: string;
    sort?: string;
    page?: string;
    view?: string;
  }>;
}

async function searchProperties(params: Awaited<SearchPageProps["searchParams"]>) {
  const where: Prisma.PropertyWhereInput = { status: "active" };

  if (params.districts) {
    where.district = { in: params.districts.split(",").filter(Boolean) };
  }

  if (params.types) {
    where.propertyType = { in: params.types.split(",").filter(Boolean) };
  }

  if (params.minRent || params.maxRent) {
    where.monthlyRent = {};
    if (params.minRent) where.monthlyRent.gte = Number(params.minRent);
    if (params.maxRent) where.monthlyRent.lte = Number(params.maxRent);
  }

  if (params.minArea || params.maxArea) {
    where.saleableArea = {};
    if (params.minArea) where.saleableArea.gte = Number(params.minArea);
    if (params.maxArea) where.saleableArea.lte = Number(params.maxArea);
  }

  if (params.q && !params.districts && !params.types) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { district: { contains: params.q, mode: "insensitive" } },
      { address: { contains: params.q, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.PropertyOrderByWithRelationInput = { engagementScore: "desc" };
  switch (params.sort) {
    case "price_asc":
      orderBy = { monthlyRent: "asc" };
      break;
    case "price_desc":
      orderBy = { monthlyRent: "desc" };
      break;
    case "area_asc":
      orderBy = { saleableArea: "asc" };
      break;
    case "area_desc":
      orderBy = { saleableArea: "desc" };
      break;
    case "recent":
      orderBy = { createdAt: "desc" };
      break;
  }

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 12;

  try {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit };
  } catch {
    return { properties: [], total: 0, page: 1, limit: 12 };
  }
}

async function ResultsView({ params }: { params: Awaited<SearchPageProps["searchParams"]> }) {
  const { properties, total } = await searchProperties(params);

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#111]/95 backdrop-blur px-6 py-4">
        <Link
          href="/search"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
        <span className="text-sm text-gray-500">
          {total} {total === 1 ? "property" : "properties"} found
        </span>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-white">No properties found</h3>
          <p className="mt-2 text-sm text-gray-400">
            Try adjusting your filters or search with different terms.
          </p>
          <Link
            href="/search"
            className="mt-6 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Modify Search
          </Link>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                district={property.district}
                address={property.address}
                propertyType={property.propertyType}
                monthlyRent={property.monthlyRent}
                saleableArea={property.saleableArea}
                images={property.images}
                verificationScore={property.verificationScore}
                engagementScore={property.engagementScore}
                floor={property.floor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  if (params.view === "results") {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#111] flex items-center justify-center">
            <div className="text-white text-sm">Loading results...</div>
          </div>
        }
      >
        <ResultsView params={params} />
      </Suspense>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#111]">
      {/* Close button */}
      <Link
        href="/"
        className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </Link>

      {/* Split layout */}
      <div className="flex h-full">
        {/* Left: Filters */}
        <div className="w-[340px] flex-shrink-0 border-r border-white/10">
          <Suspense>
            <SearchFilters />
          </Suspense>
        </div>

        {/* Right: AI Chat */}
        <div className="flex-1">
          <AiChat />
        </div>
      </div>
    </div>
  );
}
