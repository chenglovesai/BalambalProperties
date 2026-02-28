export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { PropertyCard } from "@/components/property-card";
import { SearchFilters } from "@/components/search-filters";
import { AiChat } from "@/components/ai-chat";
import { SearchWizard } from "@/components/search-wizard";
import { WhatIfBar } from "@/components/what-if-bar";
import { X, ArrowLeft, SlidersHorizontal, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

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
    mode?: string;
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

  let orderBy: Prisma.PropertyOrderByWithRelationInput = { aiScore: "desc" };
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
    case "score":
      orderBy = { aiScore: "desc" };
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

  const gradeColor: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Link>
            <span className="text-sm text-gray-400">
              {total} {total === 1 ? "property" : "properties"} found
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/search?${new URLSearchParams(params as Record<string, string>).toString()}&mode=wizard`}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Add extra detail
            </Link>
          </div>
        </div>
      </div>

      {/* What If bar */}
      <WhatIfBar currentParams={params} />

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-black">No properties found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters or search with different terms.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/search"
              className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Modify Search
            </Link>
            <Link
              href="/search?mode=wizard"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Try Guided Search
            </Link>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl p-6">
          {/* Sort options */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500">Sort by:</span>
            {[
              { value: "score", label: "AI Score" },
              { value: "price_asc", label: "Price ↑" },
              { value: "price_desc", label: "Price ↓" },
              { value: "area_desc", label: "Largest" },
              { value: "recent", label: "Newest" },
            ].map((s) => {
              const currentSort = params.sort || "score";
              const isActive = currentSort === s.value;
              const newParams = new URLSearchParams(params as Record<string, string>);
              newParams.set("sort", s.value);
              newParams.set("view", "results");
              return (
                <Link
                  key={s.value}
                  href={`/search?${newParams.toString()}`}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="relative group">
                <PropertyCard
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
                {/* Overlay badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[1] pointer-events-none">
                  {property.aiScore && (
                    <span className="flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-xs font-medium text-amber-400 backdrop-blur">
                      <Sparkles className="h-3 w-3" />
                      {property.aiScore}/100
                    </span>
                  )}
                  {property.buildingGrade && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${gradeColor[property.buildingGrade] || "bg-gray-100 text-gray-600"}`}>
                      Grade {property.buildingGrade}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Not happy? */}
          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h3 className="text-lg font-semibold">Not happy with what you found?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your criteria or use our guided search wizard for better results.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/search?mode=wizard"
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Look for more properties
              </Link>
            </div>
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading results...</div>
          </div>
        }
      >
        <ResultsView params={params} />
      </Suspense>
    );
  }

  if (params.mode === "wizard") {
    return (
      <div className="fixed inset-0 z-50 bg-[#111]">
        <Link
          href="/"
          className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </Link>
        <SearchWizard />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#111]">
      <Link
        href="/"
        className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </Link>

      <div className="flex h-full">
        <div className="w-[340px] flex-shrink-0 border-r border-white/10">
          <Suspense>
            <SearchFilters />
          </Suspense>
        </div>
        <div className="flex-1">
          <AiChat />
        </div>
      </div>
    </div>
  );
}
