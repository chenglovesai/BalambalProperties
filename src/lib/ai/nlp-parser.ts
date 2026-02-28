import OpenAI from "openai";
import type { ParsedQuery } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimaxi.chat/v1",
});

const SYSTEM_PROMPT = `You are a Hong Kong commercial real estate search assistant. Parse the user's natural language query into a structured search object.

Hong Kong districts include: Central, Wan Chai, Causeway Bay, North Point, Quarry Bay, Tai Koo, Sheung Wan, Sai Ying Pun, Kennedy Town, Aberdeen, Tsim Sha Tsui, Mong Kok, Yau Ma Tei, Jordan, Sham Shui Po, Cheung Sha Wan, Lai Chi Kok, Kwun Tong, Kwai Chung, Tsuen Wan, Tuen Mun, Yuen Long, Sha Tin, Fo Tan, Tai Po, Fanling.

Property types: retail, fnb, office, warehouse, industrial.

Domain knowledge:
- "shop" or "shopfront" = retail
- "restaurant", "cafe", "bubble tea", "kitchen", "food" = fnb
- "godown", "storage" = warehouse
- "studio", "coworking" = office
- GFA = Gross Floor Area, SFA = Saleable Floor Area
- Rents in HKD per month
- FEHD = Food and Environmental Hygiene Department
- FSD = Fire Services Department

Return a JSON object with this exact structure:
{
  "filters": {
    "districts": string[] | null,
    "propertyTypes": string[] | null,
    "minRent": number | null,
    "maxRent": number | null,
    "minArea": number | null,
    "maxArea": number | null,
    "floor": "ground" | "upper" | "any" | null
  },
  "softPreferences": {
    "frontage": "wide" | "narrow" | "any" | null,
    "ceilingHeight": "high" | "standard" | null,
    "loadingAccess": boolean | null,
    "exhaustFeasibility": boolean | null,
    "powerSupply": string | null
  },
  "businessContext": string | null,
  "rawIntent": string
}`;

export async function parseNaturalLanguageQuery(query: string): Promise<ParsedQuery> {
  try {
    const response = await openai.chat.completions.create({
      model: "MiniMax-Text-01",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n\nIMPORTANT: Respond ONLY with a valid JSON object. No markdown, no explanation, just raw JSON." },
        { role: "user", content: query },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    content = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(content);
    return {
      filters: {
        districts: parsed.filters?.districts || undefined,
        propertyTypes: parsed.filters?.propertyTypes || undefined,
        minRent: parsed.filters?.minRent || undefined,
        maxRent: parsed.filters?.maxRent || undefined,
        minArea: parsed.filters?.minArea || undefined,
        maxArea: parsed.filters?.maxArea || undefined,
        floor: parsed.filters?.floor || undefined,
      },
      softPreferences: {
        frontage: parsed.softPreferences?.frontage || undefined,
        ceilingHeight: parsed.softPreferences?.ceilingHeight || undefined,
        loadingAccess: parsed.softPreferences?.loadingAccess || undefined,
        exhaustFeasibility: parsed.softPreferences?.exhaustFeasibility || undefined,
        powerSupply: parsed.softPreferences?.powerSupply || undefined,
      },
      businessContext: parsed.businessContext || undefined,
      rawIntent: query,
    };
  } catch (error) {
    console.error("NLP parsing error:", error);
    return {
      filters: {},
      softPreferences: {},
      rawIntent: query,
    };
  }
}
