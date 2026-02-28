"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FengShuiPreferenceProps {
  propertyType: string;
  district: string;
  currentScore: number | null;
  currentNotes: string | null;
  floor?: string | null;
  address?: string | null;
}

type ScoreBand = "outstanding" | "excellent" | "good" | "fair" | "poor";

interface BandInfo {
  label: string;
  color: string;
  ringColor: string;
  bgColor: string;
  description: string;
  emoji: string;
}

const BAND_MAP: Record<ScoreBand, BandInfo> = {
  outstanding: {
    label: "Outstanding",
    color: "text-amber-600",
    ringColor: "stroke-amber-500",
    bgColor: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200",
    description:
      "Exceptional qi flow and elemental harmony. This property is considered highly auspicious — a rare find prized by Feng Shui practitioners.",
    emoji: "🏆",
  },
  excellent: {
    label: "Excellent",
    color: "text-emerald-600",
    ringColor: "stroke-emerald-500",
    bgColor: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
    description:
      "Strong positive energy with well-balanced elements. The property's orientation and layout support wealth accumulation and business prosperity.",
    emoji: "🌟",
  },
  good: {
    label: "Good",
    color: "text-blue-600",
    ringColor: "stroke-blue-500",
    bgColor: "bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200",
    description:
      "Favourable energy patterns with minor areas for improvement. Overall a positive environment for business and well-being.",
    emoji: "👍",
  },
  fair: {
    label: "Fair",
    color: "text-orange-600",
    ringColor: "stroke-orange-500",
    bgColor: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200",
    description:
      "Mixed energy — some favourable aspects offset by areas of concern. Feng Shui remedies may help improve the overall balance.",
    emoji: "⚖️",
  },
  poor: {
    label: "Poor",
    color: "text-red-600",
    ringColor: "stroke-red-500",
    bgColor: "bg-gradient-to-br from-red-50 to-rose-50 border-red-200",
    description:
      "Challenging energy configuration. Multiple Feng Shui concerns are present — consider professional consultation before committing.",
    emoji: "⚠️",
  },
};

function getScoreBand(score: number): ScoreBand {
  if (score >= 90) return "outstanding";
  if (score >= 80) return "excellent";
  if (score >= 70) return "good";
  if (score >= 60) return "fair";
  return "poor";
}

interface ElementInfo {
  name: string;
  chinese: string;
  direction: string;
  color: string;
  dotColor: string;
  meaning: string;
  businessUse: string;
}

const FIVE_ELEMENTS: ElementInfo[] = [
  {
    name: "Water",
    chinese: "水",
    direction: "North",
    color: "text-blue-700",
    dotColor: "bg-blue-500",
    meaning: "Wealth, flow, communication",
    businessUse: "Trading, finance, logistics",
  },
  {
    name: "Wood",
    chinese: "木",
    direction: "East / SE",
    color: "text-green-700",
    dotColor: "bg-green-500",
    meaning: "Growth, expansion, creativity",
    businessUse: "Startups, education, media",
  },
  {
    name: "Fire",
    chinese: "火",
    direction: "South",
    color: "text-red-700",
    dotColor: "bg-red-500",
    meaning: "Fame, recognition, passion",
    businessUse: "Marketing, entertainment, F&B",
  },
  {
    name: "Earth",
    chinese: "土",
    direction: "Centre / SW / NE",
    color: "text-amber-700",
    dotColor: "bg-amber-500",
    meaning: "Stability, nourishment, trust",
    businessUse: "Real estate, healthcare, hospitality",
  },
  {
    name: "Metal",
    chinese: "金",
    direction: "West / NW",
    color: "text-gray-600",
    dotColor: "bg-gray-400",
    meaning: "Precision, clarity, efficiency",
    businessUse: "Legal, tech, banking",
  },
];

function getDominantElement(score: number, propertyType: string): ElementInfo {
  const typeMap: Record<string, number> = {
    office: 4,
    retail: 2,
    fnb: 2,
    warehouse: 0,
    industrial: 4,
  };
  const idx = typeMap[propertyType] ?? Math.floor((score % 50) / 10);
  return FIVE_ELEMENTS[idx % 5];
}

function getFloorAnalysis(floor: string | null | undefined): {
  verdict: string;
  detail: string;
} | null {
  if (!floor) return null;
  const nums = floor.match(/\d+/g);
  if (!nums?.length) return null;
  const floorNum = parseInt(nums[0], 10);
  if (isNaN(floorNum)) return null;

  const has4 = floor.includes("4");
  const has8 = floor.includes("8");
  const has6 = floor.includes("6");
  const has9 = floor.includes("9");

  if (floorNum === 4 || floorNum === 14 || floorNum === 24 || floorNum === 44)
    return {
      verdict: "Unlucky floor",
      detail: `Floor ${floorNum} contains the number 4 (四, sì) which sounds like "death" (死, sǐ) in Cantonese and Mandarin. Properties on 4th, 14th, 24th, and 44th floors are traditionally avoided and may trade at a discount.`,
    };

  if (has8)
    return {
      verdict: "Very lucky floor",
      detail: `Floor ${floorNum} contains the number 8 (八, bā) which sounds like "prosper" (發, fā). The number 8 is the most auspicious in Chinese culture — properties with 8 can command up to 20% premium.`,
    };

  if (has6)
    return {
      verdict: "Lucky floor",
      detail: `Floor ${floorNum} contains the number 6 (六, liù) which represents "smooth" or "flowing" (流, liú). It symbolises smooth progress in business and life.`,
    };

  if (has9)
    return {
      verdict: "Lucky floor",
      detail: `Floor ${floorNum} contains the number 9 (九, jiǔ) which sounds like "long-lasting" (久, jiǔ). It represents longevity and eternity — associated with enduring success.`,
    };

  if (has4)
    return {
      verdict: "Caution",
      detail: `Floor ${floorNum} contains the number 4 (四, sì). While not a primary 4-floor, the presence of the digit is traditionally considered less favourable as it sounds like "death" (死).`,
    };

  return {
    verdict: "Neutral floor",
    detail: `Floor ${floorNum} carries no strong numerological significance in Chinese tradition. It is neither particularly lucky nor unlucky.`,
  };
}

function getAddressNumerology(address: string | null | undefined): string | null {
  if (!address) return null;
  const digits = address.replace(/\D/g, "");
  if (!digits) return null;

  const digitArr = digits.split("").map(Number);
  const sum = digitArr.reduce((a, b) => a + b, 0);

  const parts: string[] = [];
  if (digits.includes("8")) parts.push("contains the prosperity number 8 (發)");
  if (digits.includes("6")) parts.push("features 6, symbolising smooth progress (流)");
  if (digits.includes("9")) parts.push("includes 9, representing longevity (久)");
  if (digits.includes("4")) parts.push("contains 4, associated with death (死) — less favourable");

  if (parts.length === 0) {
    if (sum % 8 === 0) return `Address numerology: digit sum ${sum} is divisible by 8, considered moderately auspicious.`;
    return null;
  }

  return `Address numerology: ${parts.join("; ")}. Digit sum is ${sum}.`;
}

function ScoreRing({ score, band }: { score: number; band: BandInfo }) {
  const radius = 40;
  const strokeWidth = 6;
  const svgSize = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${band.ringColor} transition-all duration-700`}
          style={{ stroke: "currentColor" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${band.color}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function FengShuiPreference({
  propertyType,
  district,
  currentScore,
  currentNotes,
  floor,
  address,
}: FengShuiPreferenceProps) {
  const [expanded, setExpanded] = useState(false);

  const searchUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (propertyType) p.set("types", propertyType);
    if (district) p.set("districts", district);
    p.set("fengShuiRated", "1");
    p.set("minFengShui", "70");
    return `/search?${p.toString()}`;
  }, [propertyType, district]);

  if (currentScore == null) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">&#9765;</span>
            Feng Shui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This property has not been Feng Shui assessed yet.
          </p>
          <Link href={searchUrl} className="mt-3 block">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Browse Feng Shui rated properties
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const bandKey = getScoreBand(currentScore);
  const band = BAND_MAP[bandKey];
  const dominantElement = getDominantElement(currentScore, propertyType);
  const floorInfo = getFloorAnalysis(floor);
  const addressInfo = getAddressNumerology(address);

  return (
    <Card className="bg-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">&#9765;</span>
          Feng Shui Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score + Band */}
        <div className={`rounded-xl border p-4 ${band.bgColor}`}>
          <div className="flex items-center gap-4">
            <ScoreRing score={currentScore} band={band} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{band.emoji}</span>
                <span className={`text-lg font-bold ${band.color}`}>{band.label}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {band.description}
              </p>
            </div>
          </div>
        </div>

        {/* Feng Shui Notes from DB */}
        {currentNotes && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Assessment Notes
            </p>
            <p className="text-sm leading-relaxed">{currentNotes}</p>
          </div>
        )}

        {/* Dominant Element */}
        <div className="rounded-lg border border-gray-100 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dominant Element
          </p>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${dominantElement.dotColor} text-white text-lg font-bold`}>
              {dominantElement.chinese}
            </div>
            <div>
              <p className={`text-sm font-semibold ${dominantElement.color}`}>
                {dominantElement.name} ({dominantElement.chinese})
              </p>
              <p className="text-xs text-muted-foreground">
                {dominantElement.direction} · {dominantElement.meaning}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Best for: <span className="font-medium text-foreground">{dominantElement.businessUse}</span>
          </p>
        </div>

        {/* Floor Numerology */}
        {floorInfo && (
          <div className="rounded-lg border border-gray-100 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Floor Numerology
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  floorInfo.verdict.includes("Unlucky")
                    ? "bg-red-100 text-red-700"
                    : floorInfo.verdict.includes("Very lucky")
                      ? "bg-amber-100 text-amber-700"
                      : floorInfo.verdict.includes("Lucky")
                        ? "bg-emerald-100 text-emerald-700"
                        : floorInfo.verdict.includes("Caution")
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                }`}
              >
                {floorInfo.verdict}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{floorInfo.detail}</p>
          </div>
        )}

        {/* Address Numerology */}
        {addressInfo && (
          <div className="rounded-lg border border-gray-100 p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Address Numerology
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">{addressInfo}</p>
          </div>
        )}

        {/* Expandable: Five Elements + Cultural Guide */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span>Five Elements &amp; Cultural Guide</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Five Elements Grid */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                The Five Elements (五行)
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {FIVE_ELEMENTS.map((el) => (
                  <div
                    key={el.name}
                    className={`flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 ${
                      el.name === dominantElement.name ? "ring-2 ring-offset-1 ring-gray-300 bg-gray-50" : ""
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-full ${el.dotColor} flex items-center justify-center text-white text-xs font-bold`}>
                      {el.chinese}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${el.color}`}>{el.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{el.meaning}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{el.direction}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lucky / Unlucky Numbers */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Number Beliefs (數字文化)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Lucky</p>
                  <div className="space-y-1 text-[11px] text-emerald-800">
                    <p><span className="font-bold">8 (八)</span> — sounds like "prosper" (發). The most auspicious number; 88 means "double prosperity".</p>
                    <p><span className="font-bold">6 (六)</span> — sounds like "flow" (流). Symbolises smooth progress in business.</p>
                    <p><span className="font-bold">9 (九)</span> — sounds like "longevity" (久). Represents eternity and the Emperor.</p>
                    <p><span className="font-bold">2 (二)</span> — "good things come in pairs" (好事成雙). Harmony and balance.</p>
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-red-700">Unlucky</p>
                  <div className="space-y-1 text-[11px] text-red-800">
                    <p><span className="font-bold">4 (四)</span> — sounds like "death" (死). Floors 4, 14, 24, 44 are avoided; many HK buildings skip them entirely.</p>
                    <p><span className="font-bold">14</span> — reads as "certain death" (實死). One of the most avoided numbers.</p>
                    <p><span className="font-bold">7 (七)</span> — associated with the Hungry Ghost month. Considered less favourable for business.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Feng Shui Tips */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Property Feng Shui Beliefs
              </p>
              <div className="rounded-lg border border-gray-100 p-3 text-[11px] text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  <span className="font-semibold text-foreground">Facing Direction:</span> South-facing (南向) properties are traditionally most prized — they receive maximum sunlight and symbolise fame and recognition. Southeast (東南) is the classical wealth corner.
                </p>
                <p>
                  <span className="font-semibold text-foreground">T-Junction (路沖):</span> Properties facing a T-junction receive "sha chi" (煞氣) — aggressive energy directed like an arrow. These are generally avoided unless specific Flying Star conditions apply.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Water Features:</span> Water (水) symbolises wealth flowing in. Properties near (but not directly below) water features, harbours, or on the lower side of a slope are considered auspicious for money accumulation.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Building Shape:</span> Regular rectangular/square buildings represent Earth energy and stability. L-shaped or irregular floor plates may have "missing corners" representing lost opportunity in that life area.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Entrance (明堂):</span> A bright, spacious entrance ("bright hall") allows positive qi to gather. Cramped or dark lobbies can stifle business fortune.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search CTA */}
        <Link href={searchUrl}>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Find similar Feng Shui rated properties
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
