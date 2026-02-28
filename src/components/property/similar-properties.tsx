import Link from "next/link";
import {
  MapPin,
  Ruler,
  Building,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatArea } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

interface SimilarPropertiesProps {
  currentPropertyId: string;
  district: string;
  propertyType: string;
  monthlyRent: number | null;
}

async function getSimilarProperties(
  currentId: string,
  district: string,
  propertyType: string,
  rent: number | null,
) {
  const rentMin = rent ? rent * 0.6 : undefined;
  const rentMax = rent ? rent * 1.5 : undefined;

  const sameDistrict = await prisma.property.findMany({
    where: {
      id: { not: currentId },
      status: "active",
      district,
      propertyType,
      ...(rentMin && rentMax
        ? { monthlyRent: { gte: rentMin, lte: rentMax } }
        : {}),
    },
    take: 3,
    orderBy: { engagementScore: "desc" },
  });

  if (sameDistrict.length >= 3) return sameDistrict;

  const sameType = await prisma.property.findMany({
    where: {
      id: { not: currentId, notIn: sameDistrict.map((p) => p.id) },
      status: "active",
      propertyType,
      ...(rentMin && rentMax
        ? { monthlyRent: { gte: rentMin, lte: rentMax } }
        : {}),
    },
    take: 3 - sameDistrict.length,
    orderBy: { engagementScore: "desc" },
  });

  return [...sameDistrict, ...sameType];
}

export async function SimilarProperties({
  currentPropertyId,
  district,
  propertyType,
  monthlyRent,
}: SimilarPropertiesProps) {
  const properties = await getSimilarProperties(
    currentPropertyId,
    district,
    propertyType,
    monthlyRent,
  );

  if (properties.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Similar Properties</h2>
        <Link href={`/search?district=${encodeURIComponent(district)}&type=${propertyType}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-sm">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => {
          const imageUrl = property.images[0] || "/placeholder-property.svg";
          const isHot = property.engagementScore > 50;
          const displayArea = property.saleableArea || property.grossArea;

          return (
            <Link key={property.id} href={`/property/${property.id}`}>
              <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={imageUrl}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge variant="secondary" className="backdrop-blur-sm bg-white/90 text-foreground text-xs">
                      {typeLabels[property.propertyType] || property.propertyType}
                    </Badge>
                    {isHot && (
                      <Badge className="bg-orange-500 text-white text-xs">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  {property.verificationScore > 0 && (
                    <div className="absolute right-3 top-3">
                      <Badge
                        variant={property.verificationScore >= 60 ? "success" : "warning"}
                        className="backdrop-blur-sm text-xs"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {property.verificationScore}%
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors text-sm">
                    {property.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">{property.district}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    {property.monthlyRent != null ? (
                      <p className="text-base font-bold text-primary">
                        {formatCurrency(property.monthlyRent)}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    ) : property.price != null ? (
                      <p className="text-base font-bold text-primary">
                        {formatCurrency(property.price)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Price on enquiry</p>
                    )}
                    {displayArea != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Ruler className="h-3 w-3" />
                        {formatArea(displayArea)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
