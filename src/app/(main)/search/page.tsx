export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { SearchPageClient } from "./search-client";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    districts?: string;
    types?: string;
    minRent?: string;
    maxRent?: string;
    minArea?: string;
    maxArea?: string;
    fengShuiRated?: string;
    minFengShui?: string;
    sort?: string;
    page?: string;
    mode?: string;
  }>;
}

async function searchProperties(params: Awaited<SearchPageProps["searchParams"]>) {
  const where: Prisma.PropertyWhereInput = { status: "active" };

  if (params.districts) {
    const districts = params.districts.split(",").filter(Boolean);
    if (districts.length === 1) {
      where.district = { contains: districts[0], mode: "insensitive" };
    } else {
      where.OR = districts.map((d) => ({
        district: { contains: d, mode: "insensitive" as const },
      }));
    }
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
    const areaFilter: Prisma.FloatNullableFilter = {};
    if (params.minArea) areaFilter.gte = Number(params.minArea);
    if (params.maxArea) areaFilter.lte = Number(params.maxArea);

    where.AND = [
      ...(where.AND ? (where.AND as Prisma.PropertyWhereInput[]) : []),
      {
        OR: [
          { saleableArea: areaFilter },
          { grossArea: areaFilter },
        ],
      },
    ];
  }

  if (params.fengShuiRated === "1" || params.minFengShui) {
    const fengShuiFilter: Prisma.IntNullableFilter = {};
    if (params.fengShuiRated === "1") fengShuiFilter.not = null;
    if (params.minFengShui) fengShuiFilter.gte = Number(params.minFengShui);
    where.fengShuiScore = fengShuiFilter;
  }

  if (params.q) {
    const words = params.q.split(/\s+/).filter((w) => w.length >= 2);
    const searchFields = ["title", "description", "district", "address", "buildingName"] as const;

    if (words.length > 1) {
      const wordConditions: Prisma.PropertyWhereInput[] = words.map((word) => ({
        OR: searchFields.map((field) => ({
          [field]: { contains: word, mode: "insensitive" as const },
        })),
      }));
      where.AND = [
        ...(where.AND ? (where.AND as Prisma.PropertyWhereInput[]) : []),
        { OR: wordConditions },
      ];
    } else {
      where.AND = [
        ...(where.AND ? (where.AND as Prisma.PropertyWhereInput[]) : []),
        {
          OR: searchFields.map((field) => ({
            [field]: { contains: params.q!, mode: "insensitive" as const },
          })),
        },
      ];
    }
  }

  let orderBy: Prisma.PropertyOrderByWithRelationInput = { updatedAt: "desc" };
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
      orderBy = { engagementScore: "desc" };
      break;
  }

  const page = Math.max(1, Number(params.page) || 1);
  const limit = 24;

  try {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { sourceListings: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties: properties.map((p) => ({
        id: p.id,
        title: p.title,
        district: p.district,
        address: p.address,
        propertyType: p.propertyType,
        monthlyRent: p.monthlyRent,
        saleableArea: p.saleableArea,
        grossArea: p.grossArea,
        price: p.price,
        images: p.images,
        verificationScore: p.verificationScore,
        engagementScore: p.engagementScore,
        floor: p.floor,
        aiScore: p.aiScore,
        buildingGrade: p.buildingGrade,
        sourceCount: p._count.sourceListings,
      })),
      total,
      page,
      limit,
    };
  } catch {
    return { properties: [], total: 0, page: 1, limit: 24 };
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const hasAnyFilter = !!(
    params.districts || params.types || params.minRent || params.maxRent ||
    params.minArea || params.maxArea || params.q || params.fengShuiRated || params.minFengShui
  );

  const { properties, total, page, limit } = await searchProperties(params);
  const totalPages = Math.ceil(total / limit);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      }
    >
      <SearchPageClient
        properties={properties}
        total={total}
        page={page}
        totalPages={totalPages}
        params={params}
        hasAnyFilter={hasAnyFilter}
      />
    </Suspense>
  );
}
