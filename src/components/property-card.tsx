import Link from "next/link";
import {
  MapPin,
  Ruler,
  Building,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatArea } from "@/lib/utils";

interface PropertyCardProps {
  id: string;
  title: string;
  district: string;
  address: string;
  propertyType: string;
  monthlyRent: number | null;
  saleableArea: number | null;
  images: string[];
  verificationScore: number;
  engagementScore: number;
  floor: string | null;
}

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

export function PropertyCard({
  id,
  title,
  district,
  address,
  propertyType,
  monthlyRent,
  saleableArea,
  images,
  verificationScore,
  engagementScore,
}: PropertyCardProps) {
  const imageUrl = images[0] || "/placeholder-property.svg";
  const isHot = engagementScore > 50;

  return (
    <Link href={`/property/${id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant="secondary" className="backdrop-blur-sm bg-white/90 text-foreground">
              {typeLabels[propertyType] || propertyType}
            </Badge>
            {isHot && (
              <Badge className="bg-orange-500 text-white">
                <TrendingUp className="mr-1 h-3 w-3" />
                Hot
              </Badge>
            )}
          </div>
          {verificationScore > 0 && (
            <div className="absolute right-3 top-3">
              <Badge
                variant={verificationScore >= 60 ? "success" : "warning"}
                className="backdrop-blur-sm"
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                {verificationScore}%
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{district} &middot; {address}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              {monthlyRent && (
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(monthlyRent)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {saleableArea && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" />
                  {formatArea(saleableArea)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                {typeLabels[propertyType] || propertyType}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
