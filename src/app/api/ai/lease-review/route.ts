import { NextRequest, NextResponse } from "next/server";
import { reviewLease } from "@/lib/ai/lease-reviewer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leaseText = typeof body.leaseText === "string" ? body.leaseText : "";

    if (!leaseText.trim()) {
      return NextResponse.json(
        { error: "leaseText is required and must be non-empty" },
        { status: 400 }
      );
    }

    if (!process.env.MINIMAX_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const result = await reviewLease(leaseText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Lease review API error:", error);
    return NextResponse.json(
      { error: "Failed to review lease" },
      { status: 500 }
    );
  }
}
