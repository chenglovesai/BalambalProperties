"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Camera, Search, ChevronDown, Loader2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "rent", label: "Rent Office", href: "/search" },
  { id: "buy", label: "Buy Space", href: "/search?type=buy" },
  { id: "coworking", label: "Coworking", href: "/search?type=coworking" },
];

const LOCATIONS = [
  "Central", "Wan Chai", "Causeway Bay", "Tsim Sha Tsui", "Mong Kok",
  "Kwun Tong", "Kwai Chung", "Sheung Wan", "North Point", "All Hong Kong",
];

function extractSearchKeywords(
  description: string,
  filters?: { propertyTypes?: string[]; districts?: string[] }
): string {
  const terms: string[] = [];
  if (filters?.propertyTypes?.length) {
    terms.push(...filters.propertyTypes);
  }
  // Extract common property terms from description that match listings
  const keywords = [
    "office", "retail", "cafe", "coworking", "industrial", "warehouse",
    "open plan", "open-plan", "natural light", "modern", "minimalist",
    "exposed", "renovated", "ground floor", "shop", "restaurant",
    "fnb", "studio", "creative", "design",
  ];
  const lower = (description || "").toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw) && !terms.includes(kw)) terms.push(kw);
  }
  return terms.slice(0, 5).join(" ").trim() || "";
}

export function LandingSearchCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("rent");
  const [location, setLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [priceRange, setPriceRange] = useState([20000, 100000]);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [capacityDropdownOpen, setCapacityDropdownOpen] = useState(false);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [vibePreview, setVibePreview] = useState<string | null>(null);
  const [vibeError, setVibeError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
        setCapacityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("q", location);
    if (selectedLocation && selectedLocation !== "All Hong Kong") {
      params.set("districts", selectedLocation);
    }
    if (capacity) params.set("capacity", capacity);
    params.set("minRent", String(priceRange[0]));
    params.set("maxRent", String(priceRange[1]));
    router.push(`/search?${params.toString()}`);
  };

  const handleVibeImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setVibeError("Please upload an image (JPEG, PNG, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVibeError("Image must be under 10MB");
      return;
    }

    setVibeError(null);
    setVibeLoading(true);
    setVibePreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ai/image-search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setVibeError(data.error || "Failed to analyze image");
        return;
      }

      const p = new URLSearchParams();
      // Use short keywords for text search - full AI description would never match listings
      const keywords = extractSearchKeywords(data.description ?? "", data.filters);
      if (keywords.trim()) p.set("q", keywords.trim());
      if (data.filters?.districts?.length)
        p.set("districts", data.filters.districts.join(","));
      if (data.filters?.propertyTypes?.length)
        p.set("types", data.filters.propertyTypes.join(","));
      if (data.filters?.minRent) p.set("minRent", String(data.filters.minRent));
      if (data.filters?.maxRent) p.set("maxRent", String(data.filters.maxRent));
      if (data.filters?.minArea) p.set("minArea", String(data.filters.minArea));
      if (data.filters?.maxArea) p.set("maxArea", String(data.filters.maxArea));

      router.push(`/search?${p.toString()}`);
    } catch {
      setVibeError("Connection error. Try again.");
    } finally {
      setVibeLoading(false);
      e.target.value = "";
    }
  };

  const clearVibePreview = () => {
    if (vibePreview) URL.revokeObjectURL(vibePreview);
    setVibePreview(null);
    setVibeError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div ref={cardRef} className="w-full rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-xl font-bold text-black">Start Your Search Today</h2>
      <p className="mt-1 text-sm text-gray-500">
        Upload a vibe image or search by features
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#1e1b4b] text-white"
                : "bg-gray-100 text-black hover:bg-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Location Input */}
      <div className="mt-6">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Enter city, zip, or address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-gray-400 focus:border-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-[#1e1b4b]"
          />
        </div>
      </div>

      {/* Vibe Image / Mood Board Upload */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleVibeImageChange}
          disabled={vibeLoading}
        />
        {vibePreview ? (
          <div className="relative rounded-lg border-2 border-[#1e1b4b] overflow-hidden bg-gray-100">
            <img
              src={vibePreview}
              alt="Vibe preview"
              className="h-32 w-full object-cover"
            />
            {vibeLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-sm text-white">Finding similar spaces...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={clearVibePreview}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={vibeLoading}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors",
              vibeLoading
                ? "cursor-wait border-gray-200 bg-gray-50"
                : "border-gray-200 bg-gray-50 hover:border-[#1e1b4b] hover:bg-gray-100"
            )}
          >
            {vibeLoading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-[#1e1b4b]" />
                <span className="mt-2 text-sm font-medium text-black">Analyzing your vibe...</span>
              </>
            ) : (
              <>
                <Camera className="h-10 w-10 text-gray-400" />
                <span className="mt-2 text-sm font-medium text-black">
                  Upload Vibe Board or Inspiration Image
                </span>
                <span className="mt-0.5 text-xs text-gray-500">
                  Photo, floor plan, or mood board — we&apos;ll find similar spaces
                </span>
              </>
            )}
          </button>
        )}
        {vibeError && (
          <p className="mt-2 text-xs text-red-600">{vibeError}</p>
        )}
      </div>

      {/* Dropdowns */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setLocationDropdownOpen(!locationDropdownOpen);
              setCapacityDropdownOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-black"
          >
            <span className={selectedLocation ? "" : "text-gray-500"}>
              {selectedLocation || "Locations"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          {locationDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(loc);
                    setLocationDropdownOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50"
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCapacityDropdownOpen(!capacityDropdownOpen);
              setLocationDropdownOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-black"
          >
            <span className={capacity ? "" : "text-gray-500"}>
              {capacity || "Capacity"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          {capacityDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
              {["1-5", "5-10", "10-20", "20-50", "50+"].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => {
                    setCapacity(cap);
                    setCapacityDropdownOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50"
                >
                  {cap}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Slider */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-500">
          <span>${(priceRange[0] / 1000).toFixed(0)}k HKD</span>
          <span>${(priceRange[1] / 1000).toFixed(0)}k+ HKD</span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={20000}
          max={100000}
          step={5000}
          className="mt-2"
        />
      </div>

      {/* Search Button */}
      <button
        type="button"
        onClick={handleSearch}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e1b4b] py-3 text-sm font-medium text-white transition-colors hover:bg-[#312e81]"
      >
        <Search className="h-4 w-4" />
        Search Listings
      </button>
    </div>
  );
}
