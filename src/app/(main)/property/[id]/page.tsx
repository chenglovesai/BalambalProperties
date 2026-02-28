export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  Building,
  DollarSign,
  Layers,
  Calendar,
  Heart,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvidencePack } from "@/components/evidence-pack";
import { RiskAssessment } from "@/components/risk-assessment";
import { ShortlistButton } from "@/components/shortlist-button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatArea, formatPsf } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

async function getProperty(id: string) {
  try {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        evidencePack: true,
        riskChecks: true,
        sourceListings: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  const images = property.images.length > 0 ? property.images : ["/placeholder-property.svg"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="overflow-hidden rounded-xl border">
            <div className="relative aspect-[16/9] bg-muted">
              <img
                src={images[0]}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge variant="secondary" className="backdrop-blur-sm bg-white/90 text-foreground">
                  {typeLabels[property.propertyType] || property.propertyType}
                </Badge>
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`View ${i + 2}`}
                    className="h-20 w-28 flex-shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Title & Location */}
          <div>
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.district} &middot; {property.address}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {property.monthlyRent && (
              <Card>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <DollarSign className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{formatCurrency(property.monthlyRent)}</p>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                </CardContent>
              </Card>
            )}
            {property.saleableArea && (
              <Card>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Ruler className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{formatArea(property.saleableArea)}</p>
                  <p className="text-xs text-muted-foreground">Saleable Area</p>
                </CardContent>
              </Card>
            )}
            {property.psfRent && (
              <Card>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Layers className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{formatPsf(property.psfRent)}</p>
                  <p className="text-xs text-muted-foreground">Per Sq Ft</p>
                </CardContent>
              </Card>
            )}
            {property.floor && (
              <Card>
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Building className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{property.floor}</p>
                  <p className="text-xs text-muted-foreground">Floor</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="evidence">Evidence Pack</TabsTrigger>
              <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Property Type</p>
                      <p className="font-medium">{typeLabels[property.propertyType] || property.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">District</p>
                      <p className="font-medium">{property.district}</p>
                    </div>
                    {property.grossArea && (
                      <div>
                        <p className="text-muted-foreground">Gross Area</p>
                        <p className="font-medium">{formatArea(property.grossArea)}</p>
                      </div>
                    )}
                    {property.saleableArea && (
                      <div>
                        <p className="text-muted-foreground">Saleable Area</p>
                        <p className="font-medium">{formatArea(property.saleableArea)}</p>
                      </div>
                    )}
                    {property.managementFee && (
                      <div>
                        <p className="text-muted-foreground">Management Fee</p>
                        <p className="font-medium">{formatCurrency(property.managementFee)}/mo</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Listed</p>
                      <p className="font-medium">{property.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence">
              {property.evidencePack ? (
                <EvidencePack data={property.evidencePack} />
              ) : (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Evidence pack is being compiled for this property.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="risk">
              {property.riskChecks.length > 0 ? (
                <RiskAssessment
                  checks={property.riskChecks}
                  sectorType={property.riskChecks[0].sectorType}
                />
              ) : (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Complete your profile to see fit-for-use risk assessments
                    tailored to your business type.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sources">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Listing Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.sourceListings.length > 0 ? (
                    property.sourceListings.map((src) => (
                      <div
                        key={src.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {src.source}
                          </p>
                          {src.agentName && (
                            <p className="text-xs text-muted-foreground">
                              Agent: {src.agentName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            Scraped: {src.scrapedAt.toLocaleDateString()}
                          </p>
                        </div>
                        {src.sourceUrl && (
                          <a
                            href={src.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No external sources available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              {property.monthlyRent && (
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(property.monthlyRent)}
                  </p>
                  {property.psfRent && (
                    <p className="text-sm text-muted-foreground">
                      {formatPsf(property.psfRent)}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <ShortlistButton propertyId={property.id} />

              <Button variant="outline" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share Listing
              </Button>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>
                  Verification Score:{" "}
                  <span className="font-semibold text-foreground">
                    {property.verificationScore}%
                  </span>
                </p>
                <p className="mt-1">
                  Canonical ID:{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    {property.canonicalId}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
