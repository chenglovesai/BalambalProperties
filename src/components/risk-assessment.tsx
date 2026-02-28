"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { RiskCheckData } from "@/types";
import { getRiskColor } from "@/lib/utils";

interface RiskAssessmentProps {
  checks: RiskCheckData[];
  sectorType: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  pass: <CheckCircle className="h-5 w-5 text-green-600" />,
  fail: <XCircle className="h-5 w-5 text-red-600" />,
  risk: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  unknown: <HelpCircle className="h-5 w-5 text-gray-400" />,
};

const statusLabels: Record<string, string> = {
  pass: "Pass",
  fail: "Fail",
  risk: "Risk",
  unknown: "Unknown",
};

const sectorLabels: Record<string, string> = {
  fnb: "F&B",
  retail: "Retail",
  warehouse: "Warehouse / Logistics",
  office: "Office",
};

const checkNameLabels: Record<string, string> = {
  ventilation_exhaust: "Ventilation & Exhaust Feasibility",
  fire_safety: "Fire Safety Documentation",
  fehd_licensing: "FEHD Licensing Feasibility",
  ubw_impact: "UBW Impact on Licensing",
  signage_shopfront: "Signage & Shopfront Feasibility",
  planning_compliance: "Planning Condition Compliance",
  accessibility: "Accessibility Requirements",
  loading_bay: "Loading Bay Access",
  goods_lift: "Goods Lift Capacity",
  fire_compartment: "Fire Compartmentation",
  dangerous_goods: "Dangerous Goods Storage",
};

function computeOverallRisk(checks: RiskCheckData[]): {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  color: string;
} {
  if (checks.length === 0) return { score: 0, level: "Medium", color: "text-amber-600" };

  let score = 100;
  for (const check of checks) {
    if (check.status === "fail") score -= 25;
    else if (check.status === "risk") score -= 15;
    else if (check.status === "unknown") score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { score, level: "Low", color: "text-emerald-600" };
  if (score >= 60) return { score, level: "Medium", color: "text-amber-600" };
  if (score >= 40) return { score, level: "High", color: "text-red-500" };
  return { score, level: "Critical", color: "text-red-700" };
}

export function RiskAssessment({ checks, sectorType }: RiskAssessmentProps) {
  if (!checks.length) return null;

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const riskCount = checks.filter((c) => c.status === "risk").length;
  const unknownCount = checks.filter((c) => c.status === "unknown").length;

  const overall = computeOverallRisk(checks);

  const criticalChecks = checks.filter((c) => c.status === "fail" || c.status === "risk");
  const passedChecks = checks.filter((c) => c.status === "pass");
  const unknownChecks = checks.filter((c) => c.status === "unknown");

  const actionItems = checks
    .filter((c) => c.status !== "pass")
    .map((c) => ({
      check: checkNameLabels[c.checkName] || c.checkName,
      action: c.recommendation,
      priority: c.status === "fail" ? "High" : c.status === "risk" ? "Medium" : "Low",
    }));

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Fit-for-Use Assessment
              <Badge variant="secondary">{sectorLabels[sectorType] || sectorType}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Risk Score Circle */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <svg width={100} height={100} className="-rotate-90">
                  <circle cx={50} cy={50} r={40} fill="none" strokeWidth={8} className="stroke-muted" />
                  <circle
                    cx={50} cy={50} r={40} fill="none" strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - overall.score / 100)}
                    className={`transition-all duration-500 ${overall.color}`}
                    style={{ stroke: "currentColor" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{overall.score}</span>
                </div>
              </div>
              <Badge variant={
                overall.level === "Low" ? "success"
                : overall.level === "Medium" ? "warning"
                : "destructive"
              }>
                {overall.level} Risk
              </Badge>
            </div>

            {/* Counts + Summary */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <p className="text-lg font-bold text-emerald-700">{passCount}</p>
                  <p className="text-xs text-emerald-600">Pass</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <p className="text-lg font-bold text-red-700">{failCount}</p>
                  <p className="text-xs text-red-600">Fail</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2">
                  <p className="text-lg font-bold text-amber-700">{riskCount}</p>
                  <p className="text-xs text-amber-600">Risk</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-500">{unknownCount}</p>
                  <p className="text-xs text-gray-500">Unknown</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {overall.level === "Low"
                  ? `This property passes most ${sectorLabels[sectorType] || sectorType} compliance checks. Low risk for licensing issues.`
                  : overall.level === "Medium"
                    ? `Some areas need attention for ${sectorLabels[sectorType] || sectorType} use. Review flagged items before committing.`
                    : `Significant compliance risks identified for ${sectorLabels[sectorType] || sectorType} use. Professional assessment strongly recommended.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        AI-generated assessment based on available data. Consult qualified professionals before making decisions.
      </div>

      {/* Issues & Risks (if any) */}
      {criticalChecks.length > 0 && (
        <Card className="bg-white border-l-4 border-l-red-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Issues & Risks ({criticalChecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {criticalChecks.map((check, idx) => (
              <RiskCheckItem key={check.id} check={check} isFirst={idx === 0} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Passed Checks */}
      {passedChecks.length > 0 && (
        <Card className="bg-white border-l-4 border-l-emerald-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              Passed ({passedChecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {passedChecks.map((check, idx) => (
              <RiskCheckItem key={check.id} check={check} isFirst={idx === 0} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unknown Checks */}
      {unknownChecks.length > 0 && (
        <Card className="bg-white border-l-4 border-l-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-500">
              <HelpCircle className="h-5 w-5" />
              Insufficient Data ({unknownChecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {unknownChecks.map((check, idx) => (
              <RiskCheckItem key={check.id} check={check} isFirst={idx === 0} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      {actionItems.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-primary" />
              Action Plan
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Recommended steps before signing a lease for {sectorLabels[sectorType] || sectorType} use
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 ${
                    item.priority === "High"
                      ? "bg-red-500"
                      : item.priority === "Medium"
                        ? "bg-amber-500"
                        : "bg-gray-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.check}</p>
                      <Badge variant={
                        item.priority === "High" ? "destructive"
                        : item.priority === "Medium" ? "warning"
                        : "secondary"
                      } className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RiskCheckItem({ check, isFirst }: { check: RiskCheckData; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {!isFirst && <Separator className="my-3" />}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start justify-between w-full text-left"
      >
        <div className="flex items-start gap-3">
          {statusIcons[check.status]}
          <div>
            <p className="text-sm font-medium">
              {checkNameLabels[check.checkName] || check.checkName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {check.explanation}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Badge variant="outline" className={getRiskColor(check.status)}>
            {statusLabels[check.status]}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 ml-8 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="rounded-lg bg-muted/40 p-3 space-y-2">
            <p className="text-sm text-muted-foreground">{check.explanation}</p>
            <Separator />
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                Confidence: <strong className="text-foreground">{Math.round(check.confidence * 100)}%</strong>
              </span>
              <Progress value={check.confidence * 100} className="h-1.5 flex-1 max-w-[120px]" />
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
              <p className="text-xs text-primary font-medium">{check.recommendation}</p>
            </div>
            {check.sources.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {check.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded border px-2 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Reference {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
