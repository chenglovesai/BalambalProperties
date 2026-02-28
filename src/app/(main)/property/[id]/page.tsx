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
  Share2,
  ExternalLink,
  Phone,
  Mail,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Shield,
  TrendingUp,
  HelpCircle,
  AlertTriangle,
  Train,
  ArrowUpDown,
  Wind,
  Flame,
  Video,
  Star,
  CircleDot,
  Lightbulb,
  MessageSquareWarning,
  FileQuestion,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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

  const images = property.images.length > 0 ? property.images : ["/placeholder-property.svg"];
  const regulatoryNotes = (property.regulatoryNotes as RegulatoryItem[] | null) ?? [];
  const aiSummary = generateAISummary(property);

  const totalMonthly = (property.monthlyRent ?? 0) + (property.managementFee ?? 0);
  const totalUpfront =
    (property.buildingDeposit ?? 0) +
    (property.agentCommission ?? 0) +
    (property.legalFees ?? 0) +
    (property.stampDuty ?? 0);

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
          {/* Image Gallery */}
          <div className="overflow-hidden rounded-xl border bg-white">
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
                {property.buildingGrade && (
                  <Badge
                    variant="outline"
                    className={`backdrop-blur-sm border ${gradeColors[property.buildingGrade] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}
                  >
                    Grade {property.buildingGrade}
                  </Badge>
                )}
              </div>
              {property.aiScore != null && (
                <div className="absolute right-4 top-4">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">{property.aiScore}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              )}
              {property.videoTourUrl && (
                <a
                  href={property.videoTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4"
                >
                  <Button size="sm" className="gap-1.5 bg-white/90 text-foreground backdrop-blur-sm hover:bg-white">
                    <Video className="h-4 w-4" />
                    Video Tour
                  </Button>
                </a>
              )}
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
            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-base">Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                    <DetailItem label="Property Type" value={typeLabels[property.propertyType] || property.propertyType} />
                    <DetailItem label="District" value={property.district} />
                    {property.grossArea != null && <DetailItem label="Gross Area" value={formatArea(property.grossArea)} />}
                    {property.saleableArea != null && <DetailItem label="Saleable Area" value={formatArea(property.saleableArea)} />}
                    {property.ceilingHeight != null && <DetailItem label="Ceiling Height" value={`${property.ceilingHeight}m`} />}
                    {property.floor && <DetailItem label="Floor" value={property.floor} />}
                    {property.mtrStation && (
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Train className="h-3.5 w-3.5" /> MTR Station
                        </p>
                        <p className="font-medium">
                          {property.mtrStation}
                          {property.mtrProximity && <span className="text-muted-foreground font-normal"> ({property.mtrProximity})</span>}
                        </p>
                      </div>
                    )}
                    <DetailItem
                      label="Loading Access"
                      value={property.loadingAccess ? "Yes" : "No"}
                      icon={<ArrowUpDown className="h-3.5 w-3.5" />}
                    />
                    <DetailItem
                      label="Exhaust System"
                      value={property.hasExhaust ? "Installed" : "Not Installed"}
                      icon={<Wind className="h-3.5 w-3.5" />}
                    />
                    <DetailItem
                      label="FSD Certification"
                      value={property.hasFSD ? "Certified" : "Not Certified"}
                      icon={<Flame className="h-3.5 w-3.5" />}
                    />
                    <DetailItem label="Listed" value={property.createdAt.toLocaleDateString()} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Cost Breakdown Tab ── */}
            <TabsContent value="costs" className="space-y-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Monthly Costs */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Monthly Costs
                    </h3>
                    <div className="space-y-2">
                      <CostLine label="Monthly Rent" amount={property.monthlyRent} />
                      <CostLine label="Management Fee" amount={property.managementFee} />
                      <Separator />
                      <CostLine label="Total Monthly Cost" amount={totalMonthly > 0 ? totalMonthly : null} bold />
                    </div>
                  </div>

                  {/* Upfront Costs */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Upfront Costs
                    </h3>
                    <div className="space-y-2">
                      <CostLine label="Building Deposit" amount={property.buildingDeposit} />
                      <CostLine label="Agent Commission" amount={property.agentCommission} />
                      <CostLine label="Legal Fees" amount={property.legalFees} />
                      {property.stampDuty != null && (
                        <CostLine label="Stamp Duty" amount={property.stampDuty} />
                      )}
                      <Separator />
                      <CostLine label="Total Upfront Cost" amount={totalUpfront > 0 ? totalUpfront : null} bold />
                    </div>
                  </div>

                  {totalMonthly > 0 && totalUpfront > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                      <p className="text-sm text-muted-foreground">
                        To move in you&apos;ll need approximately{" "}
                        <span className="font-bold text-foreground">{formatCurrency(totalUpfront + totalMonthly)}</span>{" "}
                        (first month + upfront costs).
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── AI Summary Tab ── */}
            <TabsContent value="ai-summary" className="space-y-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Generated Summary
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Analysis based on available property data. Verify independently before making decisions.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits */}
                  {aiSummary.benefits.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Benefits
                      </h3>
                      <ul className="space-y-2">
                        {aiSummary.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Trade-offs */}
                  {aiSummary.tradeoffs.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <MessageSquareWarning className="h-4 w-4 text-amber-600" />
                        Trade-offs
                      </h3>
                      <ul className="space-y-2">
                        {aiSummary.tradeoffs.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Unknowns */}
                  {aiSummary.unknowns.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <FileQuestion className="h-4 w-4 text-blue-600" />
                        Key Unknowns to Ask Agent
                      </h3>
                      <ul className="space-y-2">
                        {aiSummary.unknowns.map((u, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                            {u}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Regulations Summary */}
                  {regulatoryNotes.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <Scale className="h-4 w-4 text-purple-600" />
                        Regulations Summary
                      </h3>
                      <div className="rounded-lg border p-3 space-y-2">
                        {regulatoryNotes.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <RegulatoryStatusIcon status={item.status} />
                            <span className="text-muted-foreground">{item.label}</span>
                            {item.note && (
                              <span className="ml-auto text-xs text-muted-foreground">{item.note}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
              <Card className="bg-white">
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
                          <p className="text-sm font-medium capitalize">{src.source}</p>
                          {src.agentName && (
                            <p className="text-xs text-muted-foreground">Agent: {src.agentName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            Scraped: {src.scrapedAt.toLocaleDateString()}
                          </p>
                        </div>
                        {src.sourceUrl && (
                          <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No external sources available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

              <Button variant="outline" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share Listing
              </Button>

              <Separator />

              {/* Agent Contact */}
              {property.agentName && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Agent Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{property.agentName}</p>
                    {property.agentCompany && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {property.agentCompany}
                      </p>
                    )}
                    {property.agentPhone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {property.agentPhone}
                      </p>
                    )}
                    {property.agentEmail && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {property.agentEmail}
                      </p>
                    )}
                  </div>
                  {property.agentPhone && (
                    <a href={`tel:${property.agentPhone}`}>
                      <Button className="w-full" size="sm">
                        <Phone className="mr-2 h-4 w-4" />
                        Contact Agent
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {(property.agentName) && <Separator />}

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

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function CostLine({
  label,
  amount,
  bold,
}: {
  label: string;
  amount: number | null | undefined;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "font-bold text-primary text-base" : "font-medium"}>
        {amount != null ? formatCurrency(amount) : "—"}
      </span>
    </div>
  );
}

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
