"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  Ruler,
  MapPin,
  Clock,
  Building,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_SEARCHES = [
  { label: "Offices in Central", districts: "Central", types: "office" },
  { label: "F&B in Causeway Bay", districts: "Causeway Bay", types: "fnb" },
  { label: "Warehouse under $20K", types: "warehouse", maxRent: "20000" },
  { label: "Retail in TST", districts: "Tsim Sha Tsui", types: "retail" },
  { label: "Coworking in Wan Chai", districts: "Wan Chai", types: "coworking" },
];

const LISTING_TYPES = ["Buy", "Rent", "Mortgage"];

const DURATIONS = [
  "< 1 year",
  "1-3 years",
  "3-5 years",
  "5+ years",
];

const COMMERCIAL_USES = [
  "Office",
  "Retail",
  "F&B",
  "Warehouse",
  "Industrial",
  "Coworking",
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listingType, setListingType] = useState(
    searchParams.get("listingType") || "Rent"
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minRent") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxRent") || "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") || "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") || "");
  const [location, setLocation] = useState(searchParams.get("districts") || "");
  const [duration, setDuration] = useState("");
  const [commercialUse, setCommercialUse] = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) || []
  );

  function applyFilters() {
    const params = new URLSearchParams();
    if (location) params.set("districts", location);
    if (minPrice) params.set("minRent", minPrice);
    if (maxPrice) params.set("maxRent", maxPrice);
    if (minArea) params.set("minArea", minArea);
    if (maxArea) params.set("maxArea", maxArea);
    if (commercialUse.length) params.set("types", commercialUse.join(","));
    params.set("view", "results");
    router.push(`/search?${params.toString()}`);
  }

  function handleQuickSearch(q: typeof QUICK_SEARCHES[number]) {
    const params = new URLSearchParams();
    if (q.districts) params.set("districts", q.districts);
    if (q.types) params.set("types", q.types);
    if (q.maxRent) params.set("maxRent", q.maxRent);
    params.set("view", "results");
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black">Filters</h2>
        <p className="text-xs text-gray-400">Hong Kong commercial properties</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Quick Searches */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Zap className="h-3.5 w-3.5" />
            Quick Searches
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SEARCHES.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => handleQuickSearch(q)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#1e1b4b] hover:bg-[#f0efff] hover:text-[#1e1b4b]"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Listing Type */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <DollarSign className="h-3.5 w-3.5" />
            Listing Type
          </label>
          <div className="flex gap-2">
            {LISTING_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setListingType(t)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  listingType === t
                    ? "bg-[#1e1b4b] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Commercial Use */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Building className="h-3.5 w-3.5" />
            Property Type
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMERCIAL_USES.map((u) => {
              const val = u.toLowerCase();
              const active = commercialUse.includes(val);
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() =>
                    setCommercialUse(
                      active
                        ? commercialUse.filter((v) => v !== val)
                        : [...commercialUse, val]
                    )
                  }
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-[#1e1b4b] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {u}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <MapPin className="h-3.5 w-3.5" />
            District
          </label>
          <input
            type="text"
            placeholder="e.g. Central, Wan Chai, Kwun Tong..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <DollarSign className="h-3.5 w-3.5" />
            Monthly Rent (HKD)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
            />
            <span className="text-gray-300">–</span>
            <input
              type="text"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
            />
          </div>
        </div>

        {/* Floor Area */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Ruler className="h-3.5 w-3.5" />
            Floor Area (sqft)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Min"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
            />
            <span className="text-gray-300">–</span>
            <input
              type="text"
              placeholder="Max"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
            />
          </div>
        </div>

        {/* Lease Duration */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            Lease Duration
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(duration === d ? "" : d)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  duration === d
                    ? "bg-[#1e1b4b] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div className="border-t border-gray-200 bg-white px-5 py-4">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full rounded-lg bg-[#1e1b4b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#312e81]"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
