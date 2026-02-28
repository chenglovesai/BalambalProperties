import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validators";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessType: data.businessType,
        businessDesc: data.businessDesc || null,
        onboarded: true,
        preferences: {
          businessType: data.businessType,
          districts: data.districts || [],
          propertyTypes: data.propertyTypes || [],
          budgetMin: data.budgetMin || 0,
          budgetMax: data.budgetMax || 0,
          areaMin: data.areaMin || 0,
          areaMax: data.areaMax || 0,
          priorities: data.priorities || {
            price: 3,
            location: 3,
            size: 3,
            compliance: 3,
            condition: 3,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      businessType: true,
      businessDesc: true,
      preferences: true,
      onboarded: true,
    },
  });

  return NextResponse.json(user);
}
