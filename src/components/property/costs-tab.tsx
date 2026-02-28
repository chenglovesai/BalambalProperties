"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  PiggyBank,
  ArrowRight,
  Calendar,
  BarChart3,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CostsTabProps {
  monthlyRent: number | null;
  managementFee: number | null;
  buildingDeposit: number | null;
  agentCommission: number | null;
  legalFees: number | null;
  stampDuty: number | null;
  saleableArea: number | null;
  psfRent: number | null;
  price: number | null;
  district: string;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const DISTRICT_AVG_PSF: Record<string, number> = {
  Central: 55,
  "Wan Chai": 42,
  "Causeway Bay": 65,
  "North Point": 30,
  "Quarry Bay": 32,
  "Tai Koo": 34,
  "Sheung Wan": 40,
  "Tsim Sha Tsui": 48,
  "Mong Kok": 55,
  "Kwun Tong": 22,
  "Kwai Chung": 15,
  "Tsuen Wan": 18,
  "Sham Shui Po": 30,
};

export function CostsTab({
  monthlyRent,
  managementFee,
  buildingDeposit,
  agentCommission,
  legalFees,
  stampDuty,
  saleableArea,
  psfRent,
  price,
  district,
}: CostsTabProps) {
  const [budget, setBudget] = useState<string>("");
  const [showCalculator, setShowCalculator] = useState(false);

  const totalMonthly = (monthlyRent ?? 0) + (managementFee ?? 0);
  const totalUpfront =
    (buildingDeposit ?? 0) + (agentCommission ?? 0) + (legalFees ?? 0) + (stampDuty ?? 0);
  const moveInTotal = totalMonthly + totalUpfront;
  const annualCost = totalMonthly * 12;
  const threeYearCost = annualCost * 3 + totalUpfront;

  const monthlyItems = [
    { label: "Monthly Rent", amount: monthlyRent },
    { label: "Management Fee", amount: managementFee },
  ].filter((item) => item.amount != null && item.amount > 0);

  const upfrontItems = [
    { label: "Building Deposit", amount: buildingDeposit },
    { label: "Agent Commission", amount: agentCommission },
    { label: "Legal Fees", amount: legalFees },
    { label: "Stamp Duty", amount: stampDuty },
  ].filter((item) => item.amount != null && item.amount > 0);

  const rentPortion = monthlyRent && totalMonthly > 0 ? (monthlyRent / totalMonthly) * 100 : 100;
  const mgmtPortion = managementFee && totalMonthly > 0 ? (managementFee / totalMonthly) * 100 : 0;

  const districtAvgPsf = DISTRICT_AVG_PSF[district];
  const psfDiff = psfRent && districtAvgPsf ? ((psfRent - districtAvgPsf) / districtAvgPsf) * 100 : null;

  const budgetNum = parseFloat(budget);
  const monthsAffordable = budgetNum > 0 && totalMonthly > 0
    ? Math.floor((budgetNum - totalUpfront) / totalMonthly)
    : null;

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Total</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {totalMonthly > 0 ? fmt(totalMonthly) : "—"}
            </p>
            {totalMonthly > 0 && (
              <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="bg-primary" style={{ width: `${rentPortion}%` }} />
                <div className="bg-blue-300" style={{ width: `${mgmtPortion}%` }} />
              </div>
            )}
            {totalMonthly > 0 && (
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Rent {Math.round(rentPortion)}%</span>
                {mgmtPortion > 0 && <span>Mgmt {Math.round(mgmtPortion)}%</span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Upfront Total</p>
            <p className="text-2xl font-bold mt-1">
              {totalUpfront > 0 ? fmt(totalUpfront) : "—"}
            </p>
            {upfrontItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {upfrontItems.length} item{upfrontItems.length !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-emerald-400">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Move-in Cost</p>
            <p className="text-2xl font-bold mt-1">
              {moveInTotal > 0 ? fmt(moveInTotal) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              First month + upfront
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-primary" />
            Detailed Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monthly */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Monthly Costs
            </h3>
            <div className="space-y-2">
              {monthlyItems.map((item) => (
                <CostLine key={item.label} label={item.label} amount={item.amount!} total={totalMonthly} />
              ))}
              {monthlyItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No monthly cost data available.</p>
              )}
              {totalMonthly > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Total Monthly</span>
                    <span className="font-bold text-primary text-base">{fmt(totalMonthly)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upfront */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Upfront Costs
            </h3>
            <div className="space-y-2">
              {upfrontItems.map((item) => (
                <CostLine key={item.label} label={item.label} amount={item.amount!} total={totalUpfront} />
              ))}
              {upfrontItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No upfront cost data available.</p>
              )}
              {totalUpfront > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Total Upfront</span>
                    <span className="font-bold text-base">{fmt(totalUpfront)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PSF Comparison */}
      {psfRent != null && districtAvgPsf && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Rent Comparison — {district}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">This property</span>
                  <span className="font-semibold">HK${psfRent.toFixed(0)}/sq ft</span>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, (psfRent / Math.max(psfRent, districtAvgPsf) * 100))}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{district} average</span>
                  <span className="font-semibold">HK${districtAvgPsf}/sq ft</span>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-300 transition-all"
                    style={{
                      width: `${Math.min(100, (districtAvgPsf / Math.max(psfRent, districtAvgPsf) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            {psfDiff != null && (
              <div className={`rounded-lg p-3 text-sm ${
                psfDiff <= -10
                  ? "bg-emerald-50 text-emerald-800"
                  : psfDiff >= 10
                    ? "bg-amber-50 text-amber-800"
                    : "bg-blue-50 text-blue-800"
              }`}>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  {psfDiff <= -10
                    ? `This property is ${Math.abs(Math.round(psfDiff))}% below the ${district} average — good value.`
                    : psfDiff >= 10
                      ? `This property is ${Math.round(psfDiff)}% above the ${district} average — consider negotiating.`
                      : `This property is roughly in line with the ${district} average.`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projections */}
      {totalMonthly > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cost Projections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Year 1</p>
                <p className="text-lg font-bold mt-1">{fmt(annualCost + totalUpfront)}</p>
                <p className="text-xs text-muted-foreground">Incl. upfront</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Year 2</p>
                <p className="text-lg font-bold mt-1">{fmt(annualCost)}</p>
                <p className="text-xs text-muted-foreground">Recurring only</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">3 Years</p>
                <p className="text-lg font-bold mt-1">{fmt(threeYearCost)}</p>
                <p className="text-xs text-muted-foreground">Total commitment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affordability Calculator */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-primary" />
              Affordability Calculator
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              {showCalculator ? "Hide" : "Open"}
            </Button>
          </div>
        </CardHeader>
        {showCalculator && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-input">Your total available budget (HKD)</Label>
              <Input
                id="budget-input"
                type="number"
                placeholder="e.g. 500000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            {monthsAffordable != null && (
              <div className="rounded-lg border p-4 space-y-3">
                {monthsAffordable > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <PiggyBank className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          You can afford ~{monthsAffordable} month{monthsAffordable !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          After paying {fmt(totalUpfront)} upfront, your remaining{" "}
                          {fmt(budgetNum - totalUpfront)} covers {monthsAffordable} months at{" "}
                          {fmt(totalMonthly)}/mo
                        </p>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          monthsAffordable >= 24
                            ? "bg-emerald-500"
                            : monthsAffordable >= 12
                              ? "bg-blue-500"
                              : monthsAffordable >= 6
                                ? "bg-amber-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, (monthsAffordable / 36) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 mo</span>
                      <span>12 mo</span>
                      <span>24 mo</span>
                      <span>36 mo</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-100 p-2">
                      <PiggyBank className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Budget insufficient</p>
                      <p className="text-xs text-muted-foreground">
                        Upfront costs alone are {fmt(totalUpfront)} — exceeds your budget of {fmt(budgetNum)}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!monthsAffordable && budget && (
              <p className="text-xs text-muted-foreground">
                Enter a valid budget amount to see how long you can afford this space.
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function CostLine({
  label,
  amount,
  total,
}: {
  label: string;
  amount: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{fmt(amount)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/40 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
