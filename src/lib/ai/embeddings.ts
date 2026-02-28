import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimaxi.chat/v1",
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "embo-01",
    input: text,
  });
  return response.data[0].embedding;
}

export function buildPropertyEmbeddingText(property: {
  title: string;
  description: string;
  district: string;
  propertyType: string;
  address: string;
  floor?: string | null;
  saleableArea?: number | null;
}): string {
  const parts = [
    property.title,
    property.description,
    `District: ${property.district}`,
    `Type: ${property.propertyType}`,
    `Address: ${property.address}`,
  ];

  if (property.floor) parts.push(`Floor: ${property.floor}`);
  if (property.saleableArea) parts.push(`Area: ${property.saleableArea} sq ft`);

  return parts.join(". ");
}

export async function describeImage(imageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "MiniMax-Text-01",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this commercial property image in detail for search purposes. Focus on: property type, layout, condition, features, frontage, and any visible commercial use indicators.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Image description error:", error);
    return "";
  }
}
