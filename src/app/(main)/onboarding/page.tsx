"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  Utensils,
  Store,
  Briefcase,
  Warehouse,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { HK_DISTRICTS, BUSINESS_TYPES, formatCurrency, formatArea } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STEPS = ["Business Type", "Requirements", "Priorities", "Review"];

const businessIcons: Record<string, React.ReactNode> = {
  fnb: <Utensils className="h-6 w-6" />,
  retail: <Store className="h-6 w-6" />,
  office: <Briefcase className="h-6 w-6" />,
  warehouse: <Warehouse className="h-6 w-6" />,
  other: <Building2 className="h-6 w-6" />,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [businessType, setBusinessType] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState([0, 100000]);
  const [areaRange, setAreaRange] = useState([200, 3000]);
  const [priorities, setPriorities] = useState({
    price: 3,
    location: 3,
    size: 3,
    compliance: 3,
    condition: 3,
  });

  const canProceed = () => {
    if (step === 0) return !!businessType;
    return true;
  };

  async function handleComplete() {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          businessDesc,
          districts,
          budgetMin: budgetRange[0],
          budgetMax: budgetRange[1],
          areaMin: areaRange[0],
          areaMax: areaRange[1],
          priorities,
        }),
      });

      if (res.ok) {
        await update();
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Set Up Your Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Help us find the perfect property for your business
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:block",
                i === step ? "font-medium" : "text-muted-foreground"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Business Type */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What type of business are you?</CardTitle>
            <CardDescription>
              This helps us tailor property recommendations and compliance checks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUSINESS_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  onClick={() => setBusinessType(bt.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-accent",
                    businessType === bt.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      businessType === bt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {businessIcons[bt.value]}
                  </div>
                  <span className="font-medium">{bt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Requirements */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us what you need</CardTitle>
            <CardDescription>
              Describe your ideal property or set specific filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Describe your ideal property (optional)</Label>
              <Textarea
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
                placeholder="e.g., A ground-floor unit with wide frontage suitable for a bubble tea shop, near MTR station..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Monthly Budget: {formatCurrency(budgetRange[0])} - {formatCurrency(budgetRange[1])}
              </Label>
              <Slider
                value={budgetRange}
                onValueChange={setBudgetRange}
                min={0}
                max={300000}
                step={5000}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Preferred Area: {formatArea(areaRange[0])} - {formatArea(areaRange[1])}
              </Label>
              <Slider
                value={areaRange}
                onValueChange={setAreaRange}
                min={100}
                max={10000}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Districts</Label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {HK_DISTRICTS.map((d) => (
                  <label
                    key={d}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={districts.includes(d)}
                      onCheckedChange={(checked) => {
                        setDistricts(
                          checked
                            ? [...districts, d]
                            : districts.filter((v) => v !== d)
                        );
                      }}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Priorities */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Set your priorities</CardTitle>
            <CardDescription>
              Rate the importance of each factor (1 = low, 5 = high).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(
              [
                { key: "price", label: "Price / Budget" },
                { key: "location", label: "Location / District" },
                { key: "size", label: "Size / Layout" },
                { key: "compliance", label: "Compliance Readiness" },
                { key: "condition", label: "Property Condition" },
              ] as const
            ).map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{item.label}</Label>
                  <Badge variant="secondary">{priorities[item.key]}/5</Badge>
                </div>
                <Slider
                  value={[priorities[item.key]]}
                  onValueChange={([v]) =>
                    setPriorities({ ...priorities, [item.key]: v })
                  }
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review your profile</CardTitle>
            <CardDescription>
              Confirm your preferences. You can always update them later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Business Type</p>
                <p className="font-medium capitalize">
                  {BUSINESS_TYPES.find((b) => b.value === businessType)?.label || businessType}
                </p>
              </div>
              {businessDesc && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{businessDesc}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Budget Range</p>
                <p className="font-medium">
                  {formatCurrency(budgetRange[0])} - {formatCurrency(budgetRange[1])}/mo
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Area Range</p>
                <p className="font-medium">
                  {formatArea(areaRange[0])} - {formatArea(areaRange[1])}
                </p>
              </div>
              {districts.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Districts</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {districts.map((d) => (
                      <Badge key={d} variant="secondary" className="text-xs">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Priorities</p>
                <div className="mt-1 grid grid-cols-2 gap-1 text-sm">
                  <span>Price: {priorities.price}/5</span>
                  <span>Location: {priorities.location}/5</span>
                  <span>Size: {priorities.size}/5</span>
                  <span>Compliance: {priorities.compliance}/5</span>
                  <span>Condition: {priorities.condition}/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? "Saving..." : "Complete Setup"}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
