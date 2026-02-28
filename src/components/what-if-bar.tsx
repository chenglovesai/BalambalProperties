"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";

interface WhatIfBarProps {
  currentParams: Record<string, string | undefined>;
}

const SCENARIOS = [
  {
    id: "budget_up_20",
    label: "What if I increase my budget by 20%?",
    icon: "💰",
    apply: (params: URLSearchParams) => {
      const max = Number(params.get("maxRent") || 0);
      if (max) params.set("maxRent", String(Math.round(max * 1.2)));
      else params.delete("maxRent");
    },
  },
  {
    id: "budget_up_50",
    label: "What if I increase my budget by 50%?",
    icon: "💸",
    apply: (params: URLSearchParams) => {
      const max = Number(params.get("maxRent") || 0);
      if (max) params.set("maxRent", String(Math.round(max * 1.5)));
      else params.delete("maxRent");
    },
  },
  {
    id: "further_mtr",
    label: "What if I'm 5 mins further from the MTR?",
    icon: "🚇",
    apply: (params: URLSearchParams) => {
      params.delete("districts");
    },
  },
  {
    id: "no_view",
    label: "What if I don't need a nice view?",
    icon: "🏙️",
    apply: (params: URLSearchParams) => {
      params.delete("districts");
    },
  },
  {
    id: "smaller",
    label: "What if I accept 20% smaller space?",
    icon: "📐",
    apply: (params: URLSearchParams) => {
      const min = Number(params.get("minArea") || 0);
      if (min) params.set("minArea", String(Math.round(min * 0.8)));
    },
  },
  {
    id: "any_grade",
    label: "What if I consider all building grades?",
    icon: "🏢",
    apply: (params: URLSearchParams) => {
      params.delete("grade");
    },
  },
  {
    id: "more_types",
    label: "What if I look at similar property types?",
    icon: "🔄",
    apply: (params: URLSearchParams) => {
      params.delete("types");
    },
  },
];

export function WhatIfBar({ currentParams }: WhatIfBarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleScenario(scenarioId: string) {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(currentParams)) {
      if (v) params.set(k, v);
    }
    params.set("view", "results");
    scenario.apply(params);
    router.push(`/search?${params.toString()}`);
  }

  const visibleScenarios = expanded ? SCENARIOS : SCENARIOS.slice(0, 4);

  return (
    <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Sparkles className="h-4 w-4" />
            What if...?
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleScenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => handleScenario(s.id)}
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors"
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
          {SCENARIOS.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  More options <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
