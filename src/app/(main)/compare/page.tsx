"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronDown, ArrowLeftRight, Calculator, Sparkles } from "lucide-react";

interface Property {
  id: string;
  title: string;
  district: string;
  address: string;
  monthlyRent: number | null;
  managementFee: number | null;
  saleableArea: number | null;
  grossArea: number | null;
  psfRent: number | null;
  buildingGrade: string | null;
  aiScore: number | null;
  ceilingHeight: number | null;
  mtrProximity: string | null;
  verificationScore: number;
  features: unknown;
  images: string[];
  price: number | null;
}

type Direction = "lower" | "higher";

interface MetricRow {
  label: string;
  key: keyof Property;
  format?: (v: unknown) => string;
  better?: Direction;
}

function fmt(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    try {
      const arr = Array.isArray(v) ? v : Object.values(v as Record<string, unknown>);
      return arr.join(", ") || "—";
    } catch {
      return "—";
    }
  }
  return String(v);
}

const metrics: MetricRow[] = [
  { label: "District", key: "district" },
  { label: "Address", key: "address" },
  {
    label: "Monthly Rent",
    key: "monthlyRent",
    format: (v) => (v != null ? `HK$${Number(v).toLocaleString()}` : "—"),
    better: "lower",
  },
  {
    label: "Management Fee",
    key: "managementFee",
    format: (v) => (v != null ? `HK$${Number(v).toLocaleString()}` : "—"),
    better: "lower",
  },
  {
    label: "Saleable Area",
    key: "saleableArea",
    format: (v) => (v != null ? `${Number(v).toLocaleString()} sqft` : "—"),
    better: "higher",
  },
  {
    label: "Gross Area",
    key: "grossArea",
    format: (v) => (v != null ? `${Number(v).toLocaleString()} sqft` : "—"),
    better: "higher",
  },
  {
    label: "PSF Rent",
    key: "psfRent",
    format: (v) => (v != null ? `HK$${Number(v).toFixed(1)}/sqft` : "—"),
    better: "lower",
  },
  { label: "Building Grade", key: "buildingGrade" },
  {
    label: "AI Score",
    key: "aiScore",
    format: (v) => (v != null ? `${v}/100` : "—"),
    better: "higher",
  },
  {
    label: "Ceiling Height",
    key: "ceilingHeight",
    format: (v) => (v != null ? `${v}m` : "—"),
    better: "higher",
  },
  { label: "MTR Proximity", key: "mtrProximity" },
  {
    label: "Verification Score",
    key: "verificationScore",
    format: (v) => (v != null ? `${Number(v).toFixed(0)}%` : "—"),
    better: "higher",
  },
  {
    label: "Features",
    key: "features",
    format: (v) => fmt(v),
  },
];

function cellColor(
  a: unknown,
  b: unknown,
  better: Direction | undefined,
  side: "a" | "b",
): string {
  if (!better || a == null || b == null) return "";
  const na = Number(a);
  const nb = Number(b);
  if (isNaN(na) || isNaN(nb) || na === nb) return "";
  const aWins = better === "higher" ? na > nb : na < nb;
  if (side === "a") return aWins ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600";
  return aWins ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700";
}

function PropertySelector({
  properties,
  selected,
  onChange,
  label,
}: {
  properties: Property[];
  selected: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className="flex-1">
      <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Select a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} — {p.district}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

function MortgageCalculator() {
  const [price, setPrice] = useState(10000000);
  const [downPct, setDownPct] = useState(30);
  const [rate, setRate] = useState(3.5);
  const [years, setYears] = useState(25);

  const result = useMemo(() => {
    const principal = price * (1 - downPct / 100);
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    if (monthlyRate === 0) {
      const monthly = principal / n;
      return { monthly, totalInterest: 0, totalCost: principal };
    }
    const monthly =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
      (Math.pow(1 + monthlyRate, n) - 1);
    const totalCost = monthly * n;
    const totalInterest = totalCost - principal;
    return { monthly, totalInterest, totalCost };
  }, [price, downPct, rate, years]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Mortgage Calculator</h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Property Price (HK$)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Down Payment: {downPct}%
          </label>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>10%</span>
            <span>50%</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Interest Rate (%)
          </label>
          <input
            type="number"
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Loan Term (years)
          </label>
          <div className="flex gap-2">
            {[10, 15, 20, 25, 30].map((y) => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`flex-1 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                  years === y
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-indigo-50 p-4">
        <div className="text-center">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            Monthly Payment
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            HK${Math.round(result.monthly).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            Total Interest
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            HK${Math.round(result.totalInterest).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            Total Cost
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            HK${Math.round(result.totalCost).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties?limit=50");
        const data = await res.json();
        setProperties(data.properties ?? []);
      } catch {
        console.error("Failed to load properties");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const propA = properties.find((p) => p.id === idA) ?? null;
  const propB = properties.find((p) => p.id === idB) ?? null;

  const swap = useCallback(() => {
    setIdA(idB);
    setIdB(idA);
  }, [idA, idB]);

  const aiSummary = useMemo(() => {
    if (!propA || !propB) return null;
    const parts: string[] = [];

    if (propA.monthlyRent != null && propB.monthlyRent != null) {
      const cheaper = propA.monthlyRent < propB.monthlyRent ? propA : propB;
      const diff = Math.abs(propA.monthlyRent - propB.monthlyRent);
      parts.push(
        `${cheaper.title} is HK$${diff.toLocaleString()}/mo cheaper in rent.`,
      );
    }

    if (propA.saleableArea != null && propB.saleableArea != null) {
      const larger = propA.saleableArea > propB.saleableArea ? propA : propB;
      parts.push(`${larger.title} offers more usable space.`);
    }

    if (propA.aiScore != null && propB.aiScore != null) {
      const better = propA.aiScore > propB.aiScore ? propA : propB;
      parts.push(
        `${better.title} scores higher on AI analysis (${better.aiScore}/100).`,
      );
    }

    if (propA.verificationScore !== propB.verificationScore) {
      const more =
        propA.verificationScore > propB.verificationScore ? propA : propB;
      parts.push(`${more.title} has a higher verification score.`);
    }

    if (parts.length === 0) parts.push("Both properties are comparable across key metrics.");
    return parts;
  }, [propA, propB]);

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-b from-indigo-50/60 to-white px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Compare Properties
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Place two properties side-by-side to make an informed decision
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <PropertySelector
                properties={properties}
                selected={idA}
                onChange={setIdA}
                label="Property A"
              />
              <button
                onClick={swap}
                className="mb-0.5 shrink-0 rounded-lg border border-gray-300 p-2.5 text-gray-500 transition-colors hover:bg-gray-50"
                title="Swap"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <PropertySelector
                properties={properties}
                selected={idB}
                onChange={setIdB}
                label="Property B"
              />
            </div>

            {propA && propB ? (
              <div className="mt-8 space-y-8">
                {/* Images */}
                <div className="grid grid-cols-2 gap-4">
                  {[propA, propB].map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-xl border border-gray-200">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-400">
                          No image
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-gray-900">{p.title}</p>
                        <p className="text-sm text-gray-500">{p.district}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comparison table */}
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3 font-medium text-gray-500 w-1/4">Metric</th>
                        <th className="px-4 py-3 font-medium text-gray-900 w-[37.5%]">
                          {propA.title}
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-900 w-[37.5%]">
                          {propB.title}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.map((m) => {
                        const valA = propA[m.key];
                        const valB = propB[m.key];
                        const fmtFn = m.format ?? fmt;
                        return (
                          <tr key={m.key}>
                            <td className="px-4 py-3 font-medium text-gray-500">
                              {m.label}
                            </td>
                            <td
                              className={`px-4 py-3 text-gray-900 ${cellColor(valA, valB, m.better, "a")}`}
                            >
                              {fmtFn(valA)}
                            </td>
                            <td
                              className={`px-4 py-3 text-gray-900 ${cellColor(valA, valB, m.better, "b")}`}
                            >
                              {fmtFn(valB)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mortgage Calculator */}
                <MortgageCalculator />

                {/* AI Summary */}
                {aiSummary && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        AI Comparison Summary
                      </h3>
                    </div>
                    <ul className="space-y-1.5">
                      {aiSummary.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-16 text-center text-gray-400">
                <ArrowLeftRight className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-4 text-lg font-medium">
                  Select two properties above to compare
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
