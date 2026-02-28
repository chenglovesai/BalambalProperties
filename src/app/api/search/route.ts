import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchSchema } from "@/lib/validators";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const rawParams = {
      query: url.searchParams.get("q") || undefined,
      districts: url.searchParams.get("districts")?.split(",").filter(Boolean) || undefined,
      propertyTypes: url.searchParams.get("types")?.split(",").filter(Boolean) || undefined,
      minRent: url.searchParams.get("minRent") ? Number(url.searchParams.get("minRent")) : undefined,
      maxRent: url.searchParams.get("maxRent") ? Number(url.searchParams.get("maxRent")) : undefined,
      minArea: url.searchParams.get("minArea") ? Number(url.searchParams.get("minArea")) : undefined,
      maxArea: url.searchParams.get("maxArea") ? Number(url.searchParams.get("maxArea")) : undefined,
      sort: (url.searchParams.get("sort") as string) || undefined,
      page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
    };

    const parsed = searchSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
      );
    }

    const params = parsed.data;
    const where: Prisma.PropertyWhereInput = { status: "active" };

    if (params.districts?.length) {
      where.district = { in: params.districts };
    }

    if (params.propertyTypes?.length) {
      where.propertyType = { in: params.propertyTypes };
    }

    if (params.minRent || params.maxRent) {
      where.monthlyRent = {};
      if (params.minRent) where.monthlyRent.gte = params.minRent;
      if (params.maxRent) where.monthlyRent.lte = params.maxRent;
    }

    if (params.minArea || params.maxArea) {
      where.saleableArea = {};
      if (params.minArea) where.saleableArea.gte = params.minArea;
      if (params.maxArea) where.saleableArea.lte = params.maxArea;
    }

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: "insensitive" } },
        { description: { contains: params.query, mode: "insensitive" } },
        { district: { contains: params.query, mode: "insensitive" } },
        { address: { contains: params.query, mode: "insensitive" } },
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

    const page = params.page ?? 1;
    const limit = params.limit ?? 12;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { evidencePack: true },
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
