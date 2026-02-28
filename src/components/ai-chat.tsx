"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Search,
  Building2,
  UtensilsCrossed,
  ShoppingBag,
  Warehouse,
  Monitor,
  Users,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type BusinessType =
  | "office"
  | "fnb"
  | "retail"
  | "warehouse"
  | "coworking"
  | "startup";

interface BusinessOption {
  id: BusinessType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const BUSINESS_TYPES: BusinessOption[] = [
  { id: "office", label: "Office", icon: Building2, description: "Corporate & professional" },
  { id: "startup", label: "Tech / Startup", icon: Monitor, description: "Flexible & modern" },
  { id: "fnb", label: "F&B / Restaurant", icon: UtensilsCrossed, description: "Kitchen & dining" },
  { id: "retail", label: "Retail Shop", icon: ShoppingBag, description: "Street-level commerce" },
  { id: "warehouse", label: "Warehouse", icon: Warehouse, description: "Storage & logistics" },
  { id: "coworking", label: "Coworking", icon: Users, description: "Shared workspace" },
];

interface DistrictRec {
  name: string;
  avgRent: string;
  highlight: string;
  match: "high" | "medium";
}

interface Requirement {
  label: string;
  critical: boolean;
}

interface BusinessIntel {
  districts: DistrictRec[];
  requirements: Requirement[];
  marketTip: string;
  avgBudget: string;
  searchTypes: string[];
}

const BUSINESS_INTEL: Record<BusinessType, BusinessIntel> = {
  office: {
    districts: [
      { name: "Central", avgRent: "$65-120/sqft", highlight: "Premium CBD, top-tier tenants", match: "high" },
      { name: "Wan Chai", avgRent: "$35-60/sqft", highlight: "Good MTR access, mid-range", match: "high" },
      { name: "Kwun Tong", avgRent: "$18-35/sqft", highlight: "Kowloon East hub, Grade A options", match: "medium" },
      { name: "Tsim Sha Tsui", avgRent: "$30-55/sqft", highlight: "Cross-harbour, client-facing", match: "medium" },
    ],
    requirements: [
      { label: "Proximity to MTR station (< 5 min walk)", critical: true },
      { label: "24-hour building access & security", critical: true },
      { label: "Central A/C with after-hours option", critical: false },
      { label: "Sufficient power supply for IT", critical: false },
      { label: "Meeting room / common facilities", critical: false },
    ],
    marketTip: "Kowloon East (Kwun Tong, Kai Tak) offers 40-60% savings vs Central with Grade A buildings. Many landlords offer 2-3 months rent-free for 3+ year leases.",
    avgBudget: "HK$25,000 – 80,000/mo",
    searchTypes: ["office"],
  },
  startup: {
    districts: [
      { name: "Kwun Tong", avgRent: "$18-30/sqft", highlight: "Tech hub, converted industrials", match: "high" },
      { name: "Wong Chuk Hang", avgRent: "$22-38/sqft", highlight: "South Island creative cluster", match: "high" },
      { name: "Wan Chai", avgRent: "$35-55/sqft", highlight: "Central-adjacent, good transport", match: "medium" },
      { name: "Sheung Wan", avgRent: "$30-50/sqft", highlight: "Trendy, close to Central", match: "medium" },
    ],
    requirements: [
      { label: "Flexible lease terms (1-2 year break clause)", critical: true },
      { label: "High-speed internet infrastructure", critical: true },
      { label: "Open floor plan / loft-style layout", critical: false },
      { label: "Pet-friendly building policy", critical: false },
      { label: "Nearby F&B and lifestyle amenities", critical: false },
    ],
    marketTip: "Converted industrial buildings in Kwun Tong and Wong Chuk Hang offer the best value for startups. Look for buildings with a tech tenant mix — shared amenities often follow.",
    avgBudget: "HK$12,000 – 40,000/mo",
    searchTypes: ["office", "coworking"],
  },
  fnb: {
    districts: [
      { name: "Causeway Bay", avgRent: "$80-180/sqft", highlight: "Highest foot traffic in HK", match: "high" },
      { name: "Mong Kok", avgRent: "$50-120/sqft", highlight: "Dense local dining market", match: "high" },
      { name: "Central (SoHo)", avgRent: "$60-130/sqft", highlight: "Expat & nightlife cluster", match: "medium" },
      { name: "Tsim Sha Tsui", avgRent: "$55-100/sqft", highlight: "Tourist & local mix", match: "medium" },
    ],
    requirements: [
      { label: "Exhaust system / ventilation ductwork", critical: true },
      { label: "Grease trap & drainage infrastructure", critical: true },
      { label: "Fire Services Department compliance", critical: true },
      { label: "Street-level access with signage rights", critical: true },
      { label: "Water supply & gas connection capacity", critical: false },
      { label: "Waste management / back-alley access", critical: false },
    ],
    marketTip: "Always verify exhaust system feasibility BEFORE signing. Retrofitting costs HK$200K-500K+. Buildings that previously housed F&B tenants are your safest bet.",
    avgBudget: "HK$35,000 – 150,000/mo",
    searchTypes: ["fnb", "retail"],
  },
  retail: {
    districts: [
      { name: "Causeway Bay", avgRent: "$100-300/sqft", highlight: "Prime retail, luxury brands", match: "high" },
      { name: "Mong Kok", avgRent: "$60-150/sqft", highlight: "Mass market, high volume", match: "high" },
      { name: "Tsim Sha Tsui", avgRent: "$70-200/sqft", highlight: "Canton Road luxury strip", match: "medium" },
      { name: "Central", avgRent: "$80-250/sqft", highlight: "Office worker lunch crowd", match: "medium" },
    ],
    requirements: [
      { label: "Street-level frontage with visibility", critical: true },
      { label: "Minimum 15ft ceiling height for signage", critical: false },
      { label: "Loading/unloading area for stock delivery", critical: true },
      { label: "Near MTR exit for foot traffic", critical: true },
      { label: "Adequate power for lighting & displays", critical: false },
    ],
    marketTip: "Post-COVID retail rents remain 20-30% below 2019 peaks. Negotiate hard — landlords prefer filled units. Side-street units 1-2 blocks from main roads offer 50% savings with decent traffic.",
    avgBudget: "HK$40,000 – 200,000/mo",
    searchTypes: ["retail"],
  },
  warehouse: {
    districts: [
      { name: "Kwai Chung", avgRent: "$12-22/sqft", highlight: "Container terminal adjacent", match: "high" },
      { name: "Tsuen Wan", avgRent: "$10-18/sqft", highlight: "Industrial zone, good road access", match: "high" },
      { name: "Fanling", avgRent: "$8-15/sqft", highlight: "Lowest rents, near border", match: "medium" },
      { name: "Kwun Tong", avgRent: "$15-25/sqft", highlight: "Urban warehouse, higher cost", match: "medium" },
    ],
    requirements: [
      { label: "Loading dock & freight elevator access", critical: true },
      { label: "Floor loading capacity > 150 lbs/sqft", critical: true },
      { label: "Ceiling height minimum 12ft clear", critical: false },
      { label: "24-hour vehicular access", critical: true },
      { label: "Fire sprinkler system (DG storage)", critical: false },
    ],
    marketTip: "Kwai Chung remains the logistics hub. Check floor loading limits — some older buildings only support 100 lbs/sqft. For e-commerce, consider units with separate office partitions.",
    avgBudget: "HK$15,000 – 60,000/mo",
    searchTypes: ["warehouse", "industrial"],
  },
  coworking: {
    districts: [
      { name: "Central", avgRent: "$4,500-8,000/desk", highlight: "Address prestige, networking", match: "high" },
      { name: "Wan Chai", avgRent: "$3,000-5,500/desk", highlight: "Balanced cost & location", match: "high" },
      { name: "Kwun Tong", avgRent: "$2,000-3,500/desk", highlight: "Budget-friendly, growing scene", match: "medium" },
      { name: "Tsim Sha Tsui", avgRent: "$2,800-5,000/desk", highlight: "Kowloon side, tourist area", match: "medium" },
    ],
    requirements: [
      { label: "Flexible month-to-month terms", critical: true },
      { label: "High-speed WiFi & IT support", critical: true },
      { label: "Meeting rooms included in plan", critical: false },
      { label: "Mail handling & business address", critical: false },
      { label: "24-hour access with key card", critical: false },
    ],
    marketTip: "Hot desk plans start at HK$2,000/mo but dedicated desks give better value long-term. Many operators offer free trial days — test before committing.",
    avgBudget: "HK$2,000 – 8,000/desk/mo",
    searchTypes: ["coworking", "office"],
  },
};

type AdvisorTab = "match" | "chat";

export function AiChat() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdvisorTab>("match");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const intel = selectedBusiness ? BUSINESS_INTEL[selectedBusiness] : null;

  function handleSmartSearch() {
    if (!intel) return;
    const params = new URLSearchParams();
    params.set("view", "results");
    params.set("types", intel.searchTypes.join(","));
    if (intel.districts[0]) params.set("districts", intel.districts[0].name);
    router.push(`/search?${params.toString()}`);
  }

  function handleDistrictSearch(district: string) {
    if (!intel) return;
    const params = new URLSearchParams();
    params.set("view", "results");
    params.set("types", intel.searchTypes.join(","));
    params.set("districts", district);
    router.push(`/search?${params.toString()}`);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    setLastQuery(msg);

    try {
      const res = await fetch("/api/ai/parse-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: msg }),
      });

      if (res.ok) {
        const parsed = await res.json();
        const hasFilters =
          parsed.filters?.districts?.length ||
          parsed.filters?.propertyTypes?.length ||
          parsed.filters?.minRent ||
          parsed.filters?.maxRent;

        if (hasFilters) {
          const parts: string[] = ["Here's what I found from your query:"];
          if (parsed.filters?.districts?.length)
            parts.push(`Districts: ${parsed.filters.districts.join(", ")}`);
          if (parsed.filters?.propertyTypes?.length)
            parts.push(`Types: ${parsed.filters.propertyTypes.join(", ")}`);
          if (parsed.filters?.minRent || parsed.filters?.maxRent)
            parts.push(`Budget: HK$${parsed.filters.minRent?.toLocaleString() || "0"} – ${parsed.filters.maxRent?.toLocaleString() || "any"}/mo`);
          parts.push("\nClick Search to view matching listings.");

          const sp = new URLSearchParams();
          sp.set("view", "results");
          if (parsed.filters?.districts?.length) sp.set("districts", parsed.filters.districts.join(","));
          if (parsed.filters?.propertyTypes?.length) sp.set("types", parsed.filters.propertyTypes.join(","));
          if (parsed.filters?.minRent) sp.set("minRent", String(parsed.filters.minRent));
          if (parsed.filters?.maxRent) sp.set("maxRent", String(parsed.filters.maxRent));
          setLastQuery(sp.toString());
          setChatMessages((prev) => [...prev, { role: "assistant", content: parts.join("\n") }]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Try being more specific — include a location, property type, size, or budget. Example: \"500 sqft office in Wan Chai under 30K/mo\"" },
          ]);
        }
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "Couldn't parse that. Try: \"retail unit in Mong Kok, ground floor, under 50K\"" }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Connection issue — try again or use the filters on the left." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleChatSearch() {
    if (lastQuery.includes("view=results")) {
      router.push(`/search?${lastQuery}`);
    } else if (lastQuery) {
      router.push(`/search?q=${encodeURIComponent(lastQuery)}&view=results`);
    } else {
      router.push("/search?view=results");
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#fafafa]">
      {/* Tab Header */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-5">
        <button
          onClick={() => setActiveTab("match")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors",
            activeTab === "match"
              ? "border-[#1e1b4b] text-[#1e1b4b]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Smart Match
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors",
            activeTab === "chat"
              ? "border-[#1e1b4b] text-[#1e1b4b]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Ask AI
        </button>
      </div>

      {activeTab === "match" ? (
        <div className="flex-1 overflow-y-auto">
          {!selectedBusiness ? (
            /* Step 1: Business Type Selection */
            <div className="p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Step 1</div>
              <h3 className="text-lg font-bold text-black">What&apos;s your business?</h3>
              <p className="mt-1 text-sm text-gray-500">
                We&apos;ll tailor district recommendations, requirements, and market insights.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((biz) => {
                  const Icon = biz.icon;
                  return (
                    <button
                      key={biz.id}
                      onClick={() => setSelectedBusiness(biz.id)}
                      className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-[#1e1b4b] hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0efff]">
                        <Icon className="h-5 w-5 text-[#1e1b4b]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-black">{biz.label}</div>
                        <div className="text-xs text-gray-400">{biz.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step 2: Intelligence Dashboard */
            <div className="p-5 space-y-5">
              {/* Selected type + change */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const biz = BUSINESS_TYPES.find((b) => b.id === selectedBusiness)!;
                    const Icon = biz.icon;
                    return (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e1b4b]">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-black">{biz.label}</div>
                          <div className="text-xs text-gray-400">Avg. budget: {intel!.avgBudget}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="text-xs font-medium text-[#4f46e5] hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Recommended Districts */}
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  Recommended Districts
                </div>
                <div className="space-y-2">
                  {intel!.districts.map((d) => (
                    <button
                      key={d.name}
                      onClick={() => handleDistrictSearch(d.name)}
                      className="group flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-[#1e1b4b] hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-black">{d.name}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              d.match === "high"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            )}
                          >
                            {d.match} match
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-400">{d.highlight}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500">{d.avgRent}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition-colors group-hover:text-[#1e1b4b]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Requirements */}
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Key Requirements
                </div>
                <div className="space-y-1.5">
                  {intel!.requirements.map((req) => (
                    <div
                      key={req.label}
                      className="flex items-start gap-2.5 rounded-lg bg-white px-3 py-2 border border-gray-100"
                    >
                      {req.critical ? (
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-gray-300 mt-0.5" />
                      )}
                      <span className="text-xs text-gray-700">
                        {req.label}
                        {req.critical && (
                          <span className="ml-1.5 text-[10px] font-semibold text-amber-600">CRITICAL</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Insight */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#1e1b4b]">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Market Insight
                </div>
                <p className="text-xs leading-relaxed text-gray-600">{intel!.marketTip}</p>
              </div>

              {/* Smart Search CTA */}
              <button
                onClick={handleSmartSearch}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e1b4b] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#312e81]"
              >
                <TrendingUp className="h-4 w-4" />
                Search Top-Matched Properties
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Ask AI Tab */
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0efff]">
                  <MessageSquare className="h-6 w-6 text-[#1e1b4b]" />
                </div>
                <h4 className="mt-4 text-sm font-semibold text-black">Ask anything about HK commercial property</h4>
                <p className="mt-1 max-w-[280px] text-xs text-gray-400">
                  Describe your business and requirements in plain English. I&apos;ll extract search criteria automatically.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {[
                    "500 sqft office in Central under 30K",
                    "Restaurant space in Causeway Bay with exhaust",
                    "Warehouse near Kwai Chung container port",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => { setChatInput(example); }}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-[#1e1b4b] hover:text-[#1e1b4b]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-[#1e1b4b] text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400 max-w-[85%]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Parsing your requirements...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="e.g. &quot;ground-floor retail in Mong Kok, 400 sqft&quot;"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
              />
              <button
                type="button"
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1b4b] text-white transition-colors hover:bg-[#312e81] disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {chatMessages.length > 0 && (
              <button
                type="button"
                onClick={handleChatSearch}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e1b4b] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#312e81]"
              >
                <Search className="h-4 w-4" />
                Search Properties
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
