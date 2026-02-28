import { NextRequest, NextResponse } from "next/server";
import { describeImage } from "@/lib/ai/embeddings";
import { parseNaturalLanguageQuery } from "@/lib/ai/nlp-parser";

/**
 * Vibe Image / Mood Board Search
 * Analyzes an uploaded image (mood board, inspiration photo, floor plan) and returns
 * structured search filters to find similar commercial properties.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!process.env.MINIMAX_API_KEY) {
      return NextResponse.json(
        { error: "MiniMax API key not configured" },
        { status: 503 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${imageFile.type};base64,${base64}`;

    const description = await describeImage(dataUrl);

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Could not analyze image" },
        { status: 422 }
      );
    }

    const parsed = await parseNaturalLanguageQuery(description);

    return NextResponse.json({
      description,
      filters: parsed.filters,
      rawIntent: parsed.rawIntent,
    });
  } catch (error) {
    console.error("Vibe image search error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
