import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 12));

  try {
    const properties = await prisma.property.findMany({
      where: { status: "active" },
      orderBy: { engagementScore: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        evidencePack: true,
      },
    });

    const total = await prisma.property.count({ where: { status: "active" } });

    return NextResponse.json({
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Properties fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
