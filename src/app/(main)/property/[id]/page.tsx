export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  Building,
  DollarSign,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Shield,
  HelpCircle,
  CircleDot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvidencePack } from "@/components/evidence-pack";
import { RiskAssessment } from "@/components/risk-assessment";
import { ShortlistButton } from "@/components/shortlist-button";
import { ImageGallery } from "@/components/property/image-gallery";
import { ShareButton } from "@/components/property/share-button";
import { ContactDialog } from "@/components/property/contact-dialog";
import { ScheduleViewing } from "@/components/property/schedule-viewing";
import { LocationMap } from "@/components/property/location-map";
import { SimilarProperties } from "@/components/property/similar-properties";
import { OverviewTab } from "@/components/property/overview-tab";
import { CostsTab } from "@/components/property/costs-tab";
import { AISummaryTab } from "@/components/property/ai-summary-tab";
import { SourcesTab } from "@/components/property/sources-tab";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatArea, formatPsf } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

const gradeDescriptions: Record<string, string> = {
  A: "Top-tier, modern building with premium finishes",
  B: "Good quality, functional building",
  C: "Functional, budget-friendly space",
};

const gradeColors: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 border-emerald-300",
  B: "bg-blue-100 text-blue-800 border-blue-300",
  C: "bg-amber-100 text-amber-800 border-amber-300",
};

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

interface RegulatoryItem {
  label: string;
  status: "pass" | "fail" | "pending";
  note?: string;
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

function generateAISummary(property: NonNullable<Awaited<ReturnType<typeof getProperty>>>) {
  const benefits: string[] = [];
  const tradeoffs: string[] = [];
  const unknowns: string[] = [];

  if (property.buildingGrade === "A")
    benefits.push("Premium Grade A building with modern finishes and amenities");
  else if (property.buildingGrade === "B")
    benefits.push("Good quality Grade B building with functional amenities");

  if (property.mtrProximity && property.mtrStation)
    benefits.push(`${property.mtrProximity} to ${property.mtrStation} MTR station`);

  if (property.hasExhaust) benefits.push("Exhaust system already installed — ideal for F&B use");
  if (property.hasFSD) benefits.push("Fire Services Department certification in place");
  if (property.loadingAccess) benefits.push("Dedicated loading access available on-site");

  if (property.saleableArea && property.saleableArea < 500)
    tradeoffs.push("Compact floor area may limit layout flexibility");
  if (property.ceilingHeight && property.ceilingHeight < 3)
    tradeoffs.push("Below-average ceiling height may restrict certain fit-outs");
  if (!property.hasExhaust)
    tradeoffs.push("No exhaust system — F&B operators will need to install one");
  if (!property.loadingAccess)
    tradeoffs.push("No dedicated loading access — logistics may be challenging");
  if (property.managementFee && property.monthlyRent && property.managementFee / property.monthlyRent > 0.15)
    tradeoffs.push("Management fee is a significant portion of total monthly cost");

  if (!property.hasFSD) unknowns.push("Is FSD certification achievable for this unit?");
  unknowns.push("What is the landlord's flexibility on lease term and rent review?");
  unknowns.push("Are there any upcoming building renovations or surcharges planned?");
  if (!property.hasExhaust) unknowns.push("What is the estimated cost to install an exhaust system?");

  return {
    benefits: benefits.slice(0, 4),
    tradeoffs: tradeoffs.slice(0, 3),
    unknowns: unknowns.slice(0, 3),
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  const placeholders: Record<string, string> = {
    office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop",
    retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop",
    industrial: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=500&fit=crop",
    warehouse: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=500&fit=crop",
    fnb: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop",
  };
  const validImages = property.images.filter(
    (img) => img.startsWith("http") && !img.includes("loadingphoto") && !img.includes("placeholder")
  );
  const images = validImages.length > 0
    ? validImages
    : [placeholders[property.propertyType] || placeholders.office];
  const regulatoryNotes = (property.regulatoryNotes as RegulatoryItem[] | null) ?? [];
  const aiSummary = generateAISummary(property);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
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
        {/* ─── Main Content ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery with Lightbox */}
          <ImageGallery
            images={images}
            title={property.title}
            propertyType={property.propertyType}
            buildingGrade={property.buildingGrade}
            aiScore={property.aiScore}
            videoTourUrl={property.videoTourUrl}
            floorPlanUrl={property.floorPlanUrl}
            typeLabel={typeLabels[property.propertyType] || property.propertyType}
            gradeColor={gradeColors[property.buildingGrade ?? ""] ?? "bg-gray-100 text-gray-800 border-gray-300"}
          />

          {/* Title, Location & Badges */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{property.title}</h1>
                {property.buildingName && (
                  <p className="text-sm font-medium text-muted-foreground">{property.buildingName}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">
                    {property.district} &middot; {property.address}
                  </span>
                </div>
              </div>
              {property.aiScore != null && (
                <div className="flex-shrink-0 hidden sm:block">
                  <AiScoreCircle score={property.aiScore} />
                </div>
              )}
            </div>

            {property.buildingGrade && gradeDescriptions[property.buildingGrade] && (
              <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${gradeColors[property.buildingGrade]}`}>
                <Building className="h-4 w-4" />
                <span>
                  <strong>Grade {property.buildingGrade}</strong> — {gradeDescriptions[property.buildingGrade]}
                </span>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {property.monthlyRent != null && (
              <Card className="bg-white">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <DollarSign className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{formatCurrency(property.monthlyRent)}</p>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                </CardContent>
              </Card>
            )}
            {property.saleableArea != null && (
              <Card className="bg-white">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Ruler className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{formatArea(property.saleableArea)}</p>
                  <p className="text-xs text-muted-foreground">Saleable Area</p>
                </CardContent>
              </Card>
            )}
            {property.psfRent != null && (
              <Card className="bg-white">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Layers className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{formatPsf(property.psfRent)}</p>
                  <p className="text-xs text-muted-foreground">Per Sq Ft</p>
                </CardContent>
              </Card>
            )}
            {property.floor && (
              <Card className="bg-white">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Building className="mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold">{property.floor}</p>
                  <p className="text-xs text-muted-foreground">Floor</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ─── Tabs ─── */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="ai-summary">AI Summary</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview">
              <OverviewTab
                description={property.description}
                propertyType={property.propertyType}
                district={property.district}
                address={property.address}
                saleableArea={property.saleableArea}
                grossArea={property.grossArea}
                ceilingHeight={property.ceilingHeight}
                floor={property.floor}
                mtrStation={property.mtrStation}
                mtrProximity={property.mtrProximity}
                loadingAccess={property.loadingAccess}
                hasExhaust={property.hasExhaust}
                hasFSD={property.hasFSD}
                buildingGrade={property.buildingGrade}
                buildingName={property.buildingName}
                floorPlanUrl={property.floorPlanUrl}
                createdAt={property.createdAt}
                updatedAt={property.updatedAt}
                features={property.features as Record<string, unknown> | null}
                title={property.title}
              />
            </TabsContent>

            {/* ── Cost Breakdown Tab ── */}
            <TabsContent value="costs">
              <CostsTab
                monthlyRent={property.monthlyRent}
                managementFee={property.managementFee}
                buildingDeposit={property.buildingDeposit}
                agentCommission={property.agentCommission}
                legalFees={property.legalFees}
                stampDuty={property.stampDuty}
                saleableArea={property.saleableArea}
                psfRent={property.psfRent}
                price={property.price}
                district={property.district}
              />
            </TabsContent>

            {/* ── AI Summary Tab ── */}
            <TabsContent value="ai-summary">
              <AISummaryTab
                aiScore={property.aiScore}
                benefits={aiSummary.benefits}
                tradeoffs={aiSummary.tradeoffs}
                unknowns={aiSummary.unknowns}
                regulatoryNotes={regulatoryNotes}
                propertyType={property.propertyType}
                district={property.district}
                monthlyRent={property.monthlyRent}
                psfRent={property.psfRent}
                saleableArea={property.saleableArea}
                buildingGrade={property.buildingGrade}
                hasExhaust={property.hasExhaust}
                hasFSD={property.hasFSD}
                loadingAccess={property.loadingAccess}
                mtrStation={property.mtrStation}
                ceilingHeight={property.ceilingHeight}
                floor={property.floor}
                verificationScore={property.verificationScore}
              />
            </TabsContent>

            {/* ── Evidence Tab ── */}
            <TabsContent value="evidence">
              {property.evidencePack ? (
                <EvidencePack data={property.evidencePack} />
              ) : (
                <Card className="bg-white">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Evidence pack is being compiled for this property.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Risk Tab ── */}
            <TabsContent value="risk">
              {property.riskChecks.length > 0 ? (
                <RiskAssessment
                  checks={property.riskChecks}
                  sectorType={property.riskChecks[0].sectorType}
                />
              ) : (
                <Card className="bg-white">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Complete your profile to see fit-for-use risk assessments
                    tailored to your business type.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Sources Tab ── */}
            <TabsContent value="sources">
              <SourcesTab
                sourceListings={property.sourceListings.map((src) => ({
                  ...src,
                  rawData: src.rawData as Record<string, unknown>,
                }))}
                monthlyRent={property.monthlyRent}
                title={property.title}
              />
            </TabsContent>
          </Tabs>

          {/* Location Map */}
          {property.latitude != null && property.longitude != null && (
            <LocationMap
              latitude={property.latitude}
              longitude={property.longitude}
              address={property.address}
              district={property.district}
              mtrStation={property.mtrStation}
              mtrProximity={property.mtrProximity}
            />
          )}

          {/* Similar Properties */}
          <Suspense
            fallback={
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Similar Properties</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              </div>
            }
          >
            <SimilarProperties
              currentPropertyId={property.id}
              district={property.district}
              propertyType={property.propertyType}
              monthlyRent={property.monthlyRent}
            />
          </Suspense>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="sticky top-24 bg-white">
            <CardContent className="p-6 space-y-4">
              {property.monthlyRent != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(property.monthlyRent)}
                  </p>
                  {property.psfRent != null && (
                    <p className="text-sm text-muted-foreground">{formatPsf(property.psfRent)}</p>
                  )}
                </div>
              )}
              {property.price != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Sale Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(property.price)}</p>
                </div>
              )}

              <Separator />

              <ShortlistButton propertyId={property.id} />

              <ShareButton title={property.title} propertyId={property.id} />

              <ScheduleViewing
                propertyTitle={property.title}
                agentName={property.agentName}
              />

              <Separator />

              {/* Agent Contact with Enquiry Form */}
              <ContactDialog
                agentName={property.agentName}
                agentCompany={property.agentCompany}
                agentPhone={property.agentPhone}
                agentEmail={property.agentEmail}
                propertyTitle={property.title}
                propertyId={property.id}
              />

              {property.agentName && <Separator />}

              {/* AI Score */}
              {property.aiScore != null && (
                <div className="flex items-center gap-3">
                  <AiScoreCircle score={property.aiScore} size="sm" />
                  <div>
                    <p className="text-sm font-medium">AI Score</p>
                    <p className="text-xs text-muted-foreground">
                      {property.aiScore >= 80
                        ? "Excellent match"
                        : property.aiScore >= 60
                          ? "Good match"
                          : property.aiScore >= 40
                            ? "Fair match"
                            : "Below average"}
                    </p>
                  </div>
                </div>
              )}

              {/* Verification */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Verification Score:{" "}
                  <span className="font-semibold text-foreground">{property.verificationScore}%</span>
                </p>
                <p>
                  Canonical ID:{" "}
                  <code className="rounded bg-muted px-1 text-xs">{property.canonicalId}</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feng Shui Card */}
          {property.fengShuiScore != null && (
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleDot className="h-5 w-5 text-primary" />
                  Feng Shui
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-bold">{property.fengShuiScore}/100</span>
                  </div>
                  <FengShuiMeter score={property.fengShuiScore} />
                </div>
                {property.fengShuiNotes && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {property.fengShuiNotes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Regulatory Checklist Card */}
          {regulatoryNotes.length > 0 && (
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-primary" />
                  Regulatory Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {regulatoryNotes.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <RegulatoryStatusIcon status={item.status} />
                      <div className="min-w-0">
                        <p className="font-medium">{item.label}</p>
                        {item.note && (
                          <p className="text-xs text-muted-foreground">{item.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function AiScoreCircle({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const radius = size === "sm" ? 20 : 28;
  const stroke = size === "sm" ? 4 : 5;
  const svgSize = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-blue-500"
        : score >= 40
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-500`}
          style={{ stroke: "currentColor" }}
        />
      </svg>
      <span
        className={`absolute font-bold ${size === "sm" ? "text-xs" : "text-sm"}`}
      >
        {score}
      </span>
    </div>
  );
}

function FengShuiMeter({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-blue-500"
        : score >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function RegulatoryStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pass":
      return <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />;
    case "fail":
      return <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />;
    case "pending":
      return <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />;
    default:
      return <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />;
  }
}
