"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Lock,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
  explanation: string;
  importance: string;
  whatItMeans: string;
}

export function EvidencePack({ data }: EvidencePackProps) {
  const items: CheckItem[] = [
    {
      label: "Ownership",
      status: data.ownershipStatus,
      source: data.ownershipSource,
      icon: <Key className="h-5 w-5" />,
      detail: "Cross-referenced with Land Registry",
      explanation: "Confirms the seller/landlord is the registered owner of the property at the Land Registry. Protects against fraudulent sub-letting or unauthorized leasing.",
      importance: "Critical",
      whatItMeans: data.ownershipStatus === "verified"
        ? "The landlord's ownership has been confirmed against official Land Registry records."
        : data.ownershipStatus === "pending"
          ? "Ownership verification is in progress — awaiting Land Registry confirmation."
          : "Ownership has not yet been verified. Request proof of ownership before signing.",
    },
    {
      label: "Floor Plan",
      status: data.floorPlanStatus,
      source: data.floorPlanSource,
      icon: <FileCheck className="h-5 w-5" />,
      detail: "Accuracy verification",
      explanation: "Checks that the provided floor plan matches the actual layout. Discrepancies could indicate unauthorized building works or misrepresented area.",
      importance: "High",
      whatItMeans: data.floorPlanStatus === "verified"
        ? "The floor plan has been verified as accurate and matches official records."
        : data.floorPlanStatus === "pending"
          ? "Floor plan accuracy is being checked — compare with site visit."
          : "No verified floor plan available. Request one from the agent and compare on-site.",
    },
    {
      label: "Building Record",
      status: data.buildingRecordStatus,
      source: data.buildingRecordSource,
      icon: <Building className="h-5 w-5" />,
      detail: "Cross-referenced with BRAVO system",
      explanation: "Verified against the Buildings Department BRAVO system for occupation permit, building plans, and any outstanding building orders.",
      importance: "Critical",
      whatItMeans: data.buildingRecordStatus === "verified"
        ? "Building records are clean — no outstanding orders found in BRAVO."
        : data.buildingRecordStatus === "pending"
          ? "Building records check is in progress via the BRAVO system."
          : "Building records have not been checked. Outstanding orders could affect licensing.",
    },
    {
      label: "Tenancy Status",
      status: data.tenancyStatus,
      source: null,
      icon: <ShieldCheck className="h-5 w-5" />,
      detail: data.tenancyDetail,
      explanation: "Confirms the current tenancy situation — whether the unit is vacant, has existing tenants, or has lease obligations that may affect your move-in timeline.",
      importance: "High",
      whatItMeans: data.tenancyStatus === "verified"
        ? "The unit's tenancy status has been confirmed and is as advertised."
        : data.tenancyStatus === "pending"
          ? "Tenancy details are being confirmed with the landlord."
          : "Tenancy status is unconfirmed. Ensure there are no existing lease obligations.",
    },
    {
      label: "Unauthorized Building Works",
      status: data.ubwStatus,
      source: null,
      icon: <AlertTriangle className="h-5 w-5" />,
      detail: data.ubwDetail,
      explanation: "Checks for any unauthorized building works (UBW) that could result in removal orders, fines, or impact your ability to obtain business licenses (especially FEHD for F&B).",
      importance: "Critical",
      whatItMeans: data.ubwStatus === "verified"
        ? "No unauthorized building works detected — clear for licensing applications."
        : data.ubwStatus === "pending"
          ? "UBW check is in progress. Any existing UBW may need to be rectified before licensing."
          : "UBW status unknown. This is a significant risk for F&B and retail licensing — investigate before committing.",
    },
  ];

  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const unconfirmedCount = items.filter((i) => i.status === "unconfirmed").length;

  const trustLevel =
    data.completionPct >= 80 ? "High" : data.completionPct >= 50 ? "Moderate" : "Low";
  const trustColor =
    data.completionPct >= 80 ? "text-emerald-600" : data.completionPct >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-white">
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
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xl font-bold text-emerald-700">{verifiedCount}</p>
              <p className="text-xs text-emerald-600">Verified</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-xs text-amber-600">Pending</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xl font-bold text-gray-500">{unconfirmedCount}</p>
              <p className="text-xs text-gray-500">Unconfirmed</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>
                Trust Level: <strong className={trustColor}>{trustLevel}</strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {trustLevel === "High"
                ? "Most key documents have been verified. This property has strong data backing."
                : trustLevel === "Moderate"
                  ? "Some verifications are still pending. Proceed with caution on unconfirmed items."
                  : "Most items are unconfirmed. We recommend verifying independently before committing."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Check Items */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Verification Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.map((item, idx) => (
            <EvidenceCheckItem key={item.label} item={item} isFirst={idx === 0} />
          ))}
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" />
            Verification Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <MethodologyStep
              step={1}
              title="Data Collection"
              description="Property data scraped from multiple listing sites and cross-referenced"
            />
            <MethodologyStep
              step={2}
              title="Registry Checks"
              description="Cross-verified against Land Registry, BRAVO, and government databases"
            />
            <MethodologyStep
              step={3}
              title="Ongoing Monitoring"
              description="Data refreshed regularly to catch changes and new information"
            />
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Verification is based on automated checks against public records. Professional due
            diligence by your solicitor is still recommended before signing any lease.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EvidenceCheckItem({ item, isFirst }: { item: CheckItem; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {!isFirst && <Separator className="my-2" />}
      <div className="py-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-start justify-between w-full text-left group"
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${
              item.status === "verified"
                ? "text-emerald-600"
                : item.status === "pending"
                  ? "text-amber-600"
                  : "text-muted-foreground"
            }`}>
              {item.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{item.label}</p>
                <Badge variant="outline" className="text-xs">
                  {item.importance}
                </Badge>
              </div>
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
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
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
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What this checks</p>
                <p className="text-sm text-muted-foreground mt-1">{item.explanation}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current status</p>
                <p className="text-sm text-muted-foreground mt-1">{item.whatItMeans}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MethodologyStep({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground flex-shrink-0">
        {step}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
