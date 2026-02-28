import {
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  MessageSquareWarning,
  FileQuestion,
  Scale,
  Target,
  Lightbulb,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Clock,
  XCircle,
  HandshakeIcon,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface RegulatoryItem {
  label: string;
  status: "pass" | "fail" | "pending";
  note?: string;
}

interface AISummaryTabProps {
  aiScore: number | null;
  benefits: string[];
  tradeoffs: string[];
  unknowns: string[];
  regulatoryNotes: RegulatoryItem[];
  propertyType: string;
  district: string;
  monthlyRent: number | null;
  psfRent: number | null;
  saleableArea: number | null;
  buildingGrade: string | null;
  hasExhaust: boolean | null;
  hasFSD: boolean | null;
  loadingAccess: boolean | null;
  mtrStation: string | null;
  ceilingHeight: number | null;
  floor: string | null;
  verificationScore: number;
}

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

function computeScoreBreakdown(props: AISummaryTabProps) {
  const scores: { category: string; score: number; maxScore: number; detail: string }[] = [];

  // Location Score
  let locationScore = 50;
  if (props.mtrStation) locationScore += 25;
  if (["Central", "Wan Chai", "Causeway Bay", "Tsim Sha Tsui"].includes(props.district)) locationScore += 25;
  else if (["Mong Kok", "Sheung Wan", "North Point", "Quarry Bay"].includes(props.district)) locationScore += 15;
  else locationScore += 10;
  scores.push({
    category: "Location",
    score: Math.min(100, locationScore),
    maxScore: 100,
    detail: props.mtrStation ? `Near ${props.mtrStation} MTR in ${props.district}` : `Located in ${props.district}`,
  });

  // Compliance Score
  let complianceScore = 30;
  if (props.hasFSD) complianceScore += 25;
  if (props.hasExhaust) complianceScore += 20;
  if (props.loadingAccess) complianceScore += 15;
  if (props.verificationScore >= 60) complianceScore += 10;
  scores.push({
    category: "Compliance",
    score: Math.min(100, complianceScore),
    maxScore: 100,
    detail: `${[props.hasFSD && "FSD", props.hasExhaust && "Exhaust", props.loadingAccess && "Loading"].filter(Boolean).join(", ") || "No certifications"} verified`,
  });

  // Space Quality
  let spaceScore = 40;
  if (props.buildingGrade === "A") spaceScore += 40;
  else if (props.buildingGrade === "B") spaceScore += 25;
  else if (props.buildingGrade === "C") spaceScore += 10;
  if (props.ceilingHeight && props.ceilingHeight >= 3.5) spaceScore += 15;
  else if (props.ceilingHeight && props.ceilingHeight >= 3) spaceScore += 10;
  if (props.saleableArea && props.saleableArea >= 1000) spaceScore += 5;
  scores.push({
    category: "Space Quality",
    score: Math.min(100, spaceScore),
    maxScore: 100,
    detail: props.buildingGrade ? `Grade ${props.buildingGrade} building` : "Building grade unspecified",
  });

  // Value Score
  let valueScore = 50;
  const DISTRICT_AVG: Record<string, number> = {
    Central: 55, "Wan Chai": 42, "Causeway Bay": 65, "Tsim Sha Tsui": 48,
    "Mong Kok": 55, "Kwun Tong": 22, "Sheung Wan": 40, "Kwai Chung": 15,
  };
  const avg = DISTRICT_AVG[props.district];
  if (avg && props.psfRent) {
    const diff = ((props.psfRent - avg) / avg) * 100;
    if (diff <= -20) valueScore += 40;
    else if (diff <= -10) valueScore += 30;
    else if (diff <= 5) valueScore += 20;
    else if (diff <= 15) valueScore += 10;
  } else {
    valueScore += 15;
  }
  scores.push({
    category: "Value",
    score: Math.min(100, valueScore),
    maxScore: 100,
    detail: props.psfRent ? `HK$${props.psfRent.toFixed(0)}/sq ft vs district avg` : "No PSF data",
  });

  return scores;
}

function generateNegotiationTips(props: AISummaryTabProps): string[] {
  const tips: string[] = [];

  if (!props.hasFSD)
    tips.push("Lack of FSD certification is strong leverage — request a rent concession or landlord-funded certification.");
  if (!props.hasExhaust && (props.propertyType === "fnb"))
    tips.push("No exhaust system means significant upfront cost for F&B — negotiate a rent-free fit-out period.");
  if (props.saleableArea && props.saleableArea < 500)
    tips.push("Smaller units typically have more negotiation room — try for a 5-10% discount on asking rent.");
  tips.push("Ask for a longer rent-free period (1-3 months) instead of a lower base rent for better long-term terms.");
  if (props.buildingGrade === "C" || !props.buildingGrade)
    tips.push("Older/lower grade buildings often have more flexible landlords — push for a 2+1 year lease with a break clause.");
  tips.push("Request the landlord to cover stamp duty or split legal fees as part of the deal.");

  return tips.slice(0, 4);
}

function generateSuitabilityNotes(props: AISummaryTabProps): { type: string; suitable: boolean; reason: string }[] {
  const results: { type: string; suitable: boolean; reason: string }[] = [];

  // F&B
  const fnbSuitable = !!props.hasExhaust || props.ceilingHeight !== null && props.ceilingHeight >= 3;
  results.push({
    type: "F&B",
    suitable: fnbSuitable,
    reason: fnbSuitable
      ? `${props.hasExhaust ? "Exhaust installed" : "Adequate ceiling height"}, ${props.hasFSD ? "FSD certified" : "FSD certification needed"}`
      : "No exhaust system and limited ceiling height — costly conversion",
  });

  // Retail
  const retailSuitable = props.propertyType === "retail" || (props.floor === "G" || props.floor === "G/F" || props.floor?.toLowerCase().includes("ground")) || !!props.mtrStation;
  results.push({
    type: "Retail",
    suitable: retailSuitable,
    reason: retailSuitable
      ? `${props.mtrStation ? "Good foot traffic near MTR" : ""}${props.floor?.toLowerCase().includes("ground") ? ", ground floor frontage" : ""}`
      : "Upper floor location may limit walk-in traffic",
  });

  // Warehouse
  const warehouseSuitable = !!props.loadingAccess && (props.saleableArea ?? 0) >= 1000;
  results.push({
    type: "Warehouse",
    suitable: warehouseSuitable,
    reason: warehouseSuitable
      ? `Loading access available, ${props.saleableArea ? `${props.saleableArea.toLocaleString()} sq ft` : "adequate"} floor area`
      : `${!props.loadingAccess ? "No loading access" : "Limited floor area"} — not ideal for logistics`,
  });

  // Office
  const officeSuitable = (props.buildingGrade === "A" || props.buildingGrade === "B") || !!props.mtrStation;
  results.push({
    type: "Office",
    suitable: officeSuitable,
    reason: officeSuitable
      ? `${props.buildingGrade ? `Grade ${props.buildingGrade} building` : "Good location"}${props.mtrStation ? ` near ${props.mtrStation} MTR` : ""}`
      : "Lower grade building without transit access — limited for professional services",
  });

  return results;
}

export function AISummaryTab(props: AISummaryTabProps) {
  const scoreBreakdown = computeScoreBreakdown(props);
  const overallScore = props.aiScore ?? Math.round(scoreBreakdown.reduce((sum, s) => sum + s.score, 0) / scoreBreakdown.length);
  const negotiationTips = generateNegotiationTips(props);
  const suitability = generateSuitabilityNotes(props);

  return (
    <div className="space-y-6">
      {/* AI Score Overview */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Property Analysis
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Generated from property data, market comparisons, and compliance checks. Verify independently.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Circle + Breakdown */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <svg width={120} height={120} className="-rotate-90">
                  <circle cx={60} cy={60} r={50} fill="none" strokeWidth={8} className="stroke-muted" />
                  <circle
                    cx={60} cy={60} r={50} fill="none" strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - overallScore / 100)}
                    className={`transition-all duration-700 ${
                      overallScore >= 80 ? "text-emerald-500" : overallScore >= 60 ? "text-blue-500" : overallScore >= 40 ? "text-amber-500" : "text-red-500"
                    }`}
                    style={{ stroke: "currentColor" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{overallScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <Badge variant={overallScore >= 80 ? "success" : overallScore >= 60 ? "secondary" : "warning"}>
                {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : overallScore >= 40 ? "Fair" : "Below Avg"}
              </Badge>
            </div>

            <div className="flex-1 space-y-3 w-full">
              {scoreBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span className={`font-semibold ${
                      item.score >= 75 ? "text-emerald-600" : item.score >= 50 ? "text-blue-600" : item.score >= 30 ? "text-amber-600" : "text-red-600"
                    }`}>{item.score}</span>
                  </div>
                  <Progress
                    value={item.score}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits, Trade-offs, Unknowns */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Benefits */}
        <Card className="bg-white border-t-4 border-t-emerald-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
              Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {props.benefits.length > 0 ? (
              <ul className="space-y-2.5">
                {props.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No standout benefits identified.</p>
            )}
          </CardContent>
        </Card>

        {/* Trade-offs */}
        <Card className="bg-white border-t-4 border-t-amber-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ThumbsDown className="h-4 w-4 text-amber-600" />
              Trade-offs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {props.tradeoffs.length > 0 ? (
              <ul className="space-y-2.5">
                {props.tradeoffs.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No significant trade-offs found.</p>
            )}
          </CardContent>
        </Card>

        {/* Key Unknowns */}
        <Card className="bg-white border-t-4 border-t-blue-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileQuestion className="h-4 w-4 text-blue-600" />
              Ask the Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {props.unknowns.length > 0 ? (
              <ul className="space-y-2.5">
                {props.unknowns.map((u, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No critical unknowns identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suitability by Business Type */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Suitability by Business Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {suitability.map((item, idx) => (
            <div key={item.type}>
              {idx > 0 && <Separator className="my-3" />}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1 ${item.suitable ? "bg-emerald-100" : "bg-red-100"}`}>
                  {item.suitable ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.type}</p>
                    <Badge variant={item.suitable ? "success" : "destructive"} className="text-xs">
                      {item.suitable ? "Suitable" : "Not Ideal"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Negotiation Tips */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandshakeIcon className="h-5 w-5 text-primary" />
            Negotiation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {negotiationTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Regulatory Summary */}
      {props.regulatoryNotes.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5 text-primary" />
              Regulations Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {props.regulatoryNotes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm rounded-lg border p-3">
                  <RegulatoryStatusIcon status={item.status} />
                  <span className="font-medium">{item.label}</span>
                  {item.note && (
                    <span className="ml-auto text-xs text-muted-foreground">{item.note}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        AI analysis is generated from available property data and market heuristics. Scores and
        recommendations should be verified with qualified professionals before making commitments.
      </div>
    </div>
  );
}

function RegulatoryStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pass":
      return <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />;
    case "fail":
      return <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 flex-shrink-0 text-amber-500" />;
    default:
      return <HelpCircle className="h-4 w-4 flex-shrink-0 text-gray-400" />;
  }
}
