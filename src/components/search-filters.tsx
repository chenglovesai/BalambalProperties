"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DollarSign, Ruler, MapPin, Clock, Building } from "lucide-react";
import { cn } from "@/lib/utils";

const LISTING_TYPES = ["Buy", "Rent", "Mortgage"];

const DURATIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
  "Permanent / Indefinite",
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

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Search Filters</h2>
        <p className="text-xs text-gray-400">Hong Kong commercial properties</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
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
                    ? "bg-amber-500 text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <DollarSign className="h-3.5 w-3.5" />
            Price Range (HKD)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="HK$ Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
            />
            <span className="text-gray-500">–</span>
            <input
              type="text"
              placeholder="HK$ Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Floor Area */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Ruler className="h-3.5 w-3.5" />
            Floor Area (SQ FT)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Min ft²"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
            />
            <span className="text-gray-500">–</span>
            <input
              type="text"
              placeholder="Max ft²"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <MapPin className="h-3.5 w-3.5" />
            Location
          </label>
          <input
            type="text"
            placeholder="e.g. Central, Wan Chai, Kwun Tong, Tsim..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Intended Duration */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            Intended Duration
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
                    ? "bg-amber-500 text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/15"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Commercial Use */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Building className="h-3.5 w-3.5" />
            Commercial Use
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
                      ? "bg-amber-500 text-black"
                      : "bg-white/10 text-gray-300 hover:bg-white/15"
                  )}
                >
                  {u}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div className="border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
