import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

export function RiskAssessment({ checks, sectorType }: RiskAssessmentProps) {
  if (!checks.length) return null;

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const riskCount = checks.filter((c) => c.status === "risk").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Fit-for-Use Assessment
            <Badge variant="secondary">{sectorLabels[sectorType] || sectorType}</Badge>
          </CardTitle>
        </div>
        <div className="mt-2 flex gap-3 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3.5 w-3.5" /> {passCount} Pass
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3.5 w-3.5" /> {failCount} Fail
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> {riskCount} Risk
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          AI-generated assessment based on available data. Consult qualified professionals before making decisions.
        </div>
        {checks.map((check, idx) => (
          <div key={check.id}>
            {idx > 0 && <Separator className="my-3" />}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {statusIcons[check.status]}
                  <div>
                    <p className="text-sm font-medium">
                      {checkNameLabels[check.checkName] || check.checkName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {check.explanation}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={getRiskColor(check.status)}>
                  {statusLabels[check.status]}
                </Badge>
              </div>
              <div className="ml-8 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Confidence: {Math.round(check.confidence * 100)}%
                </p>
                <p className="text-xs text-primary">
                  Recommended: {check.recommendation}
                </p>
                {check.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {check.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
