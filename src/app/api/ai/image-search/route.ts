import { NextRequest, NextResponse } from "next/server";
import { describeImage, generateEmbedding } from "@/lib/ai/embeddings";

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

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your")) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${imageFile.type};base64,${base64}`;

    const description = await describeImage(dataUrl);

    if (!description) {
      return NextResponse.json(
        { error: "Could not analyze image" },
        { status: 422 }
      );
    }

    const embedding = await generateEmbedding(description);

    return NextResponse.json({
      description,
      embedding,
      message: "Image analyzed. Use the embedding for vector similarity search.",
    });
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
