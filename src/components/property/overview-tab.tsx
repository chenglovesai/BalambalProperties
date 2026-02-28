import {
  Building,
  Ruler,
  ArrowUpDown,
  Wind,
  Flame,
  Train,
  FileImage,
  MapPin,
  Calendar,
  SquareStack,
  Warehouse,
  Zap,
  ShieldCheck,
  Maximize,
  TrendingDown,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatArea } from "@/lib/utils";

interface OverviewTabProps {
  description: string;
  propertyType: string;
  district: string;
  address: string;
  saleableArea: number | null;
  grossArea: number | null;
  ceilingHeight: number | null;
  floor: string | null;
  mtrStation: string | null;
  mtrProximity: string | null;
  loadingAccess: boolean | null;
  hasExhaust: boolean | null;
  hasFSD: boolean | null;
  buildingGrade: string | null;
  buildingName: string | null;
  floorPlanUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  features: Record<string, unknown> | null;
  title: string;
}

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

const districtDescriptions: Record<string, string> = {
  Central: "Hong Kong's premier business district — premium rents, high foot traffic, prestigious address",
  "Wan Chai": "Established commercial hub with strong F&B scene and excellent transport links",
  "Causeway Bay": "Top retail destination with the highest foot traffic in Hong Kong",
  "North Point": "Emerging commercial area with competitive rents and improving transport links",
  "Quarry Bay": "Growing tech and creative hub with modern office stock at sub-Central rents",
  "Tai Koo": "Established commercial district anchored by Taikoo Place",
  "Sheung Wan": "Trendy district popular with creative industries, close to Central",
  "Sai Ying Pun": "Rapidly gentrifying neighbourhood with growing F&B presence",
  "Tsim Sha Tsui": "Kowloon's premier commercial and retail district",
  "Mong Kok": "Highest population density in HK — excellent for retail and F&B",
  "Kwun Tong": "Major industrial-to-commercial conversion area with competitive rents",
  "Kwai Chung": "Key logistics and warehouse hub near container terminals",
  "Tsuen Wan": "Established industrial and commercial area in the New Territories",
};

export function OverviewTab(props: OverviewTabProps) {
  const {
    description,
    propertyType,
    district,
    address,
    saleableArea,
    grossArea,
    ceilingHeight,
    floor,
    mtrStation,
    mtrProximity,
    loadingAccess,
    hasExhaust,
    hasFSD,
    buildingGrade,
    buildingName,
    floorPlanUrl,
    createdAt,
    updatedAt,
    features,
    title,
  } = props;

  const efficiencyRatio =
    saleableArea && grossArea && grossArea > 0
      ? Math.round((saleableArea / grossArea) * 100)
      : null;

  const keyFeatures: { label: string; available: boolean; icon: React.ReactNode }[] = [
    { label: "Loading Access", available: !!loadingAccess, icon: <ArrowUpDown className="h-3 w-3" /> },
    { label: "Exhaust System", available: !!hasExhaust, icon: <Wind className="h-3 w-3" /> },
    { label: "FSD Certified", available: !!hasFSD, icon: <Flame className="h-3 w-3" /> },
    { label: mtrStation ? `Near ${mtrStation} MTR` : "Near MTR", available: !!mtrStation, icon: <Train className="h-3 w-3" /> },
    { label: buildingGrade ? `Grade ${buildingGrade}` : "Graded", available: !!buildingGrade, icon: <Building className="h-3 w-3" /> },
    { label: "Floor Plan Available", available: !!floorPlanUrl, icon: <FileImage className="h-3 w-3" /> },
  ];

  const availableFeatures = keyFeatures.filter((f) => f.available);
  const unavailableFeatures = keyFeatures.filter((f) => !f.available);

  const daysSinceListed = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceUpdated = Math.floor(
    (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Key Features Strip */}
      {keyFeatures.some((f) => f.available) && (
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map((f) => (
                <Badge
                  key={f.label}
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3"
                >
                  {f.icon}
                  {f.label}
                </Badge>
              ))}
              {unavailableFeatures.map((f) => (
                <Badge
                  key={f.label}
                  variant="outline"
                  className="text-muted-foreground gap-1.5 py-1 px-3 line-through opacity-50"
                >
                  {f.icon}
                  {f.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>

      {/* Property Details + Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Property Type" value={typeLabels[propertyType] || propertyType} />
            <Separator />
            <DetailRow label="District" value={district} />
            <Separator />
            <DetailRow label="Address" value={address} />
            {floor && (
              <>
                <Separator />
                <DetailRow label="Floor" value={floor} />
              </>
            )}
            {ceilingHeight != null && (
              <>
                <Separator />
                <DetailRow label="Ceiling Height" value={`${ceilingHeight}m`} />
              </>
            )}
            <Separator />
            <DetailRow
              label="Listed"
              value={`${createdAt.toLocaleDateString("en-HK", { year: "numeric", month: "short", day: "numeric" })} (${daysSinceListed}d ago)`}
            />
            {daysSinceUpdated !== daysSinceListed && (
              <>
                <Separator />
                <DetailRow
                  label="Last Updated"
                  value={`${updatedAt.toLocaleDateString("en-HK", { year: "numeric", month: "short", day: "numeric" })} (${daysSinceUpdated}d ago)`}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Area & Efficiency */}
        <div className="space-y-6">
          {(saleableArea != null || grossArea != null) && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-primary" />
                  Area Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {grossArea != null && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Gross Area</span>
                      <span className="font-semibold">{formatArea(grossArea)}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: "100%" }} />
                    </div>
                  </div>
                )}
                {saleableArea != null && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Saleable Area</span>
                      <span className="font-semibold">{formatArea(saleableArea)}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: efficiencyRatio ? `${efficiencyRatio}%` : "100%" }}
                      />
                    </div>
                  </div>
                )}
                {efficiencyRatio != null && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Efficiency Ratio</span>
                      </div>
                      <Badge
                        variant={efficiencyRatio >= 75 ? "success" : efficiencyRatio >= 60 ? "secondary" : "warning"}
                      >
                        {efficiencyRatio}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {efficiencyRatio >= 75
                        ? "Excellent — you're paying for mostly usable space."
                        : efficiencyRatio >= 60
                          ? "Average — some common area overhead is typical."
                          : "Below average — significant common area charges likely."}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance Quick Check */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Compliance Quick Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ComplianceRow
                label="Loading Access"
                status={loadingAccess}
                icon={<ArrowUpDown className="h-4 w-4" />}
              />
              <Separator />
              <ComplianceRow
                label="Exhaust System"
                status={hasExhaust}
                icon={<Wind className="h-4 w-4" />}
              />
              <Separator />
              <ComplianceRow
                label="FSD Certification"
                status={hasFSD}
                icon={<Flame className="h-4 w-4" />}
              />
              {mtrStation && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Train className="h-4 w-4 text-muted-foreground" />
                      <span>MTR Access</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mtrStation}
                      {mtrProximity && (
                        <span className="text-muted-foreground font-normal ml-1">({mtrProximity})</span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* District Context */}
      {districtDescriptions[district] && (
        <Card className="bg-white border-l-4 border-l-primary">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{district} District</p>
                <p className="text-sm text-muted-foreground mt-1">{districtDescriptions[district]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floor Plan */}
      {floorPlanUrl && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileImage className="h-5 w-5 text-primary" />
              Floor Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              <img
                src={floorPlanUrl}
                alt={`Floor plan for ${title}`}
                className="w-full object-contain max-h-[500px]"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function ComplianceRow({
  label,
  status,
  icon,
}: {
  label: string;
  status: boolean | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      <Badge variant={status ? "success" : status === false ? "destructive" : "secondary"}>
        {status ? "Yes" : status === false ? "No" : "Unknown"}
      </Badge>
    </div>
  );
}
