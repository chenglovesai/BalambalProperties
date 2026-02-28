import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ isSaved: false });
  }

  const propertyId = req.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ isSaved: false });
  }

  const shortlist = await prisma.shortlist.findUnique({
    where: {
      userId_propertyId: {
        userId: session.user.id,
        propertyId,
      },
    },
  });

  return NextResponse.json({ isSaved: !!shortlist });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { propertyId } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: "Property ID required" }, { status: 400 });
  }

  try {
    await prisma.shortlist.create({
      data: {
        userId: session.user.id,
        propertyId,
      },
    });

    await prisma.userInteraction.create({
      data: {
        userId: session.user.id,
        propertyId,
        action: "save",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { propertyId } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: "Property ID required" }, { status: 400 });
  }

  await prisma.shortlist.deleteMany({
    where: {
      userId: session.user.id,
      propertyId,
    },
  });

  await prisma.userInteraction.create({
    data: {
      userId: session.user.id,
      propertyId,
      action: "unsave",
    },
  });

  return NextResponse.json({ success: true });
}
