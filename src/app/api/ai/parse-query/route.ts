import { NextRequest, NextResponse } from "next/server";
import { parseNaturalLanguageQuery } from "@/lib/ai/nlp-parser";
import { HK_DISTRICTS } from "@/lib/utils";

function fallbackParse(query: string) {
  const lower = query.toLowerCase();

  const districts: string[] = [];
  for (const d of HK_DISTRICTS) {
    if (lower.includes(d.toLowerCase())) districts.push(d);
  }

  const propertyTypes: string[] = [];
  const typeKeywords: Record<string, string[]> = {
    office: ["office", "workspace", "work space"],
    retail: ["retail", "shop", "store"],
    fnb: ["f&b", "food", "beverage", "restaurant", "cafe", "coffee", "bubble tea", "kitchen"],
    warehouse: ["warehouse", "storage", "logistics"],
    industrial: ["industrial", "factory", "manufacturing"],
  };
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some((k) => lower.includes(k))) propertyTypes.push(type);
  }

  const priceMatch = lower.match(/(\d[\d,]*)\s*(?:hk\$|hkd)?\s*(?:to|[-–—])\s*(\d[\d,]*)/);
  let minRent: number | undefined;
  let maxRent: number | undefined;
  if (priceMatch) {
    minRent = Number(priceMatch[1].replace(/,/g, ""));
    maxRent = Number(priceMatch[2].replace(/,/g, ""));
  }

  const areaMatch = lower.match(/(\d[\d,]*)\s*(?:sq\s*ft|sqft|square\s*feet)/);
  let targetArea: number | undefined;
  if (areaMatch) {
    targetArea = Number(areaMatch[1].replace(/,/g, ""));
  }

  return {
    intent: "search",
    filters: {
      districts: districts.length > 0 ? districts : undefined,
      propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
      minRent,
      maxRent,
      minArea: targetArea ? Math.round(targetArea * 0.8) : undefined,
      maxArea: targetArea ? Math.round(targetArea * 1.2) : undefined,
    },
    businessContext: propertyTypes.length > 0 ? propertyTypes[0] : undefined,
    softPreferences: {
      exhaustFeasibility: propertyTypes.includes("fnb"),
    },
    fallback: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query string is required" },
        { status: 400 }
      );
    }

    if (!process.env.MINIMAX_API_KEY) {
      const parsed = fallbackParse(query);
      return NextResponse.json(parsed);
    }

    const parsed = await parseNaturalLanguageQuery(query);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Parse query error:", error);
    return NextResponse.json(
      { error: "Failed to parse query" },
      { status: 500 }
    );
  }
}
