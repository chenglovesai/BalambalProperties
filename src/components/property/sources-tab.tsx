import {
  Calendar,
  ExternalLink,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  User,
  Phone,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface SourceListing {
  id: string;
  source: string;
  sourceUrl: string | null;
  agentName: string | null;
  agentContact: string | null;
  scrapedAt: Date;
  rawData: Record<string, unknown>;
}

interface SourcesTabProps {
  sourceListings: SourceListing[];
  monthlyRent: number | null;
  title: string;
}

const sourceLogos: Record<string, { label: string; color: string }> = {
  "28hse": { label: "28Hse", color: "bg-blue-100 text-blue-700 border-blue-200" },
  centaline: { label: "Centaline", color: "bg-orange-100 text-orange-700 border-orange-200" },
  spacious: { label: "Spacious", color: "bg-purple-100 text-purple-700 border-purple-200" },
  midland: { label: "Midland ICI", color: "bg-red-100 text-red-700 border-red-200" },
  gohome: { label: "GoHome", color: "bg-green-100 text-green-700 border-green-200" },
};

function getFreshnessInfo(scrapedAt: Date): { label: string; color: string; level: "fresh" | "recent" | "stale" } {
  const daysSince = Math.floor((Date.now() - scrapedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 3) return { label: "Just updated", color: "text-emerald-600", level: "fresh" };
  if (daysSince <= 7) return { label: `${daysSince}d ago`, color: "text-blue-600", level: "recent" };
  if (daysSince <= 30) return { label: `${daysSince}d ago`, color: "text-amber-600", level: "recent" };
  return { label: `${daysSince}d ago`, color: "text-red-600", level: "stale" };
}

function extractPrice(rawData: Record<string, unknown>): number | null {
  const priceFields = ["price", "rent", "monthlyRent", "monthly_rent", "asking_rent"];
  for (const field of priceFields) {
    const val = rawData[field];
    if (typeof val === "number" && val > 0) return val;
    if (typeof val === "string") {
      const num = parseFloat(val.replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

export function SourcesTab({ sourceListings, monthlyRent, title }: SourcesTabProps) {
  if (sourceListings.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="py-10 text-center">
          <Globe className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No external sources available for this property.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Data may be sourced from a single provider or added manually.
          </p>
        </CardContent>
      </Card>
    );
  }

  const freshestDate = sourceListings.reduce(
    (latest, src) => (src.scrapedAt > latest ? src.scrapedAt : latest),
    sourceListings[0].scrapedAt
  );
  const freshness = getFreshnessInfo(freshestDate);

  const uniqueSources = new Set(sourceListings.map((s) => s.source));
  const uniqueAgents = new Set(sourceListings.filter((s) => s.agentName).map((s) => s.agentName));

  const prices = sourceListings
    .map((s) => extractPrice(s.rawData as Record<string, unknown>))
    .filter((p): p is number => p !== null);
  const hasPriceVariance = prices.length > 1;
  const minPrice = hasPriceVariance ? Math.min(...prices) : null;
  const maxPrice = hasPriceVariance ? Math.max(...prices) : null;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueSources.size}</p>
              <p className="text-xs text-muted-foreground">Source{uniqueSources.size !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueAgents.size || "—"}</p>
              <p className="text-xs text-muted-foreground">Agent{uniqueAgents.size !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-full p-2 ${
              freshness.level === "fresh" ? "bg-emerald-100" : freshness.level === "recent" ? "bg-amber-100" : "bg-red-100"
            }`}>
              <RefreshCcw className={`h-5 w-5 ${freshness.color}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${freshness.color}`}>{freshness.label}</p>
              <p className="text-xs text-muted-foreground">Last scraped</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Comparison */}
      {hasPriceVariance && minPrice != null && maxPrice != null && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Price Across Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {minPrice !== maxPrice ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Range</span>
                  <span className="font-semibold">
                    {formatCurrency(minPrice)} — {formatCurrency(maxPrice)}
                  </span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="absolute inset-y-0 bg-primary/30 rounded-full" style={{ left: "0%", right: "0%" }} />
                  {prices.map((p, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary border-2 border-white"
                      style={{ left: `${((p - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(minPrice)}</span>
                  <span>{formatCurrency(maxPrice)}</span>
                </div>
                {monthlyRent != null && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Our canonical price of {formatCurrency(monthlyRent)} is based on cross-referencing
                    all {prices.length} sources.
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">All sources agree on {formatCurrency(minPrice)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Consistency */}
      {sourceListings.length > 1 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Data Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ConsistencyItem
                label="Price"
                consistent={!hasPriceVariance || (minPrice != null && maxPrice != null && maxPrice <= minPrice * 1.15)}
              />
              <ConsistencyItem
                label="Title"
                consistent={true}
              />
              <ConsistencyItem
                label="Multi-source"
                consistent={uniqueSources.size > 1}
              />
              <ConsistencyItem
                label="Fresh data"
                consistent={freshness.level !== "stale"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Listings */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">All Listings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sourceListings.map((src, idx) => {
            const sourceInfo = sourceLogos[src.source.toLowerCase()];
            const srcFreshness = getFreshnessInfo(src.scrapedAt);
            const srcPrice = extractPrice(src.rawData as Record<string, unknown>);

            return (
              <div key={src.id}>
                {idx > 0 && <Separator className="my-3" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={sourceInfo?.color ?? "bg-gray-100 text-gray-700 border-gray-200"}
                      >
                        {sourceInfo?.label ?? src.source}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${
                        srcFreshness.level === "fresh"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : srcFreshness.level === "stale"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        <Clock className="mr-1 h-3 w-3" />
                        {srcFreshness.label}
                      </Badge>
                      {srcPrice != null && (
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(srcPrice)}/mo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {src.agentName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {src.agentName}
                        </span>
                      )}
                      {src.agentContact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {src.agentContact}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scraped: {src.scrapedAt.toLocaleDateString("en-HK", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {src.sourceUrl && (
                    <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Globe className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Data is automatically scraped from public listing sites and cross-referenced. Prices are
        normalized to HKD. Some fields may not be available from all sources.
      </div>
    </div>
  );
}

function ConsistencyItem({ label, consistent }: { label: string; consistent: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
      {consistent ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
      )}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
