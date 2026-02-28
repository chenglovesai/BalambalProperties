export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property-card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShortlist(userId: string) {
  try {
    const shortlists = await prisma.shortlist.findMany({
      where: { userId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
    return shortlists;
  } catch {
    return [];
  }
}

export default async function ShortlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shortlists = await getShortlist(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Heart className="h-6 w-6 text-primary" />
          My Shortlist
        </h1>
        <p className="mt-1 text-muted-foreground">
          {shortlists.length} saved {shortlists.length === 1 ? "property" : "properties"}
        </p>
      </div>

      {shortlists.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shortlists.map((s) => (
            <PropertyCard
              key={s.id}
              id={s.property.id}
              title={s.property.title}
              district={s.property.district}
              address={s.property.address}
              propertyType={s.property.propertyType}
              monthlyRent={s.property.monthlyRent}
              saleableArea={s.property.saleableArea}
              images={s.property.images}
              verificationScore={s.property.verificationScore}
              engagementScore={s.property.engagementScore}
              floor={s.property.floor}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No saved properties yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Browse properties and click the heart icon to save them to your shortlist for easy comparison.
          </p>
          <Link href="/search" className="mt-6">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Search Properties
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
