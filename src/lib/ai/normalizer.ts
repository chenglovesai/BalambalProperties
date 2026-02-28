import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NormalizedListing {
  title: string;
  titleZh: string | null;
  description: string;
  district: string;
  address: string;
  propertyType: string;
  saleableArea: number | null;
  grossArea: number | null;
  monthlyRent: number | null;
  psfRent: number | null;
  managementFee: number | null;
  floor: string | null;
  missingFields: string[];
  agentQuestions: string[];
}

const SYSTEM_PROMPT = `You are a Hong Kong commercial property data normalizer. Given a raw listing, extract and normalize the data.

Rules:
- Standardize all areas to square feet (1 sq m = 10.764 sq ft)
- Separate Saleable Floor Area (SFA) from Gross Floor Area (GFA) if both are mentioned
- Convert all rents to HKD per month. If only per-sq-ft is given, calculate monthly if area is known
- Separate management fees from headline rent if bundled
- Identify the property type: retail, fnb, office, warehouse, industrial
- Map to standard district names
- Flag any missing critical fields
- Generate questions for the agent to fill gaps

Return a JSON object with the NormalizedListing schema.`;

export async function normalizeListing(rawData: Record<string, unknown>): Promise<NormalizedListing> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Normalize this listing data:\n${JSON.stringify(rawData, null, 2)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    return JSON.parse(content);
  } catch (error) {
    console.error("Normalization error:", error);
    throw new Error("Failed to normalize listing");
  }
}

export function computeDeduplicationScore(
  a: { address: string; district: string; saleableArea: number | null },
  b: { address: string; district: string; saleableArea: number | null }
): number {
  let score = 0;

  if (a.district.toLowerCase() === b.district.toLowerCase()) {
    score += 0.3;
  }

  const addrA = a.address.toLowerCase().replace(/[^a-z0-9]/g, "");
  const addrB = b.address.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (addrA === addrB) {
    score += 0.5;
  } else if (addrA.includes(addrB) || addrB.includes(addrA)) {
    score += 0.3;
  }

  if (a.saleableArea && b.saleableArea) {
    const areaDiff = Math.abs(a.saleableArea - b.saleableArea) / Math.max(a.saleableArea, b.saleableArea);
    if (areaDiff < 0.05) score += 0.2;
    else if (areaDiff < 0.1) score += 0.1;
  }

  return score;
}
