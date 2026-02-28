import {
  ShieldCheck,
  FileCheck,
  Building,
  Key,
  AlertTriangle,
  ExternalLink,
  Clock,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { EvidencePackData } from "@/types";
import { getVerificationColor } from "@/lib/utils";

interface EvidencePackProps {
  data: EvidencePackData;
}

const statusIcons: Record<string, React.ReactNode> = {
  verified: <CheckCircle className="h-4 w-4 text-green-600" />,
  pending: <Clock className="h-4 w-4 text-amber-600" />,
  unconfirmed: <HelpCircle className="h-4 w-4 text-gray-400" />,
};

const statusLabels: Record<string, string> = {
  verified: "Verified",
  pending: "Pending",
  unconfirmed: "Unconfirmed",
};

interface CheckItem {
  label: string;
  status: string;
  source: string | null;
  icon: React.ReactNode;
  detail?: string | null;
}

export function EvidencePack({ data }: EvidencePackProps) {
  const items: CheckItem[] = [
    {
      label: "Ownership",
      status: data.ownershipStatus,
      source: data.ownershipSource,
      icon: <Key className="h-4 w-4" />,
      detail: "Cross-referenced with Land Registry",
    },
    {
      label: "Floor Plan",
      status: data.floorPlanStatus,
      source: data.floorPlanSource,
      icon: <FileCheck className="h-4 w-4" />,
      detail: "Accuracy verification",
    },
    {
      label: "Building Record",
      status: data.buildingRecordStatus,
      source: data.buildingRecordSource,
      icon: <Building className="h-4 w-4" />,
      detail: "Cross-referenced with BRAVO system",
    },
    {
      label: "Tenancy Status",
      status: data.tenancyStatus,
      source: null,
      icon: <ShieldCheck className="h-4 w-4" />,
      detail: data.tenancyDetail,
    },
    {
      label: "Unauthorized Building Works",
      status: data.ubwStatus,
      source: null,
      icon: <AlertTriangle className="h-4 w-4" />,
      detail: data.ubwDetail,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Evidence Pack
          </CardTitle>
          <Badge variant={data.completionPct >= 60 ? "success" : "warning"}>
            {data.completionPct}% Complete
          </Badge>
        </div>
        <Progress value={data.completionPct} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item, idx) => (
          <div key={item.label}>
            {idx > 0 && <Separator className="my-2" />}
            <div className="flex items-start justify-between py-1">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={getVerificationColor(item.status)}
                >
                  {statusIcons[item.status]}
                  <span className="ml-1">{statusLabels[item.status]}</span>
                </Badge>
                {item.source && (
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
