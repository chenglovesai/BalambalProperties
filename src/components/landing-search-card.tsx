"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Camera, Search, ChevronDown } from "lucide-react";
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
                ? "bg-[#4f46e5] text-white"
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
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-gray-400 focus:border-[#4f46e5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => {}}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-10 transition-colors hover:border-[#4f46e5] hover:bg-gray-100"
        >
          <Camera className="h-10 w-10 text-gray-400" />
          <span className="mt-2 text-sm font-medium text-black">
            Upload Inspiration or &quot;Vibe&quot; Image
          </span>
          <span className="mt-0.5 text-xs text-gray-500">
            Search by photo, floor plan, or sketch
          </span>
        </button>
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
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] py-3 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
      >
        <Search className="h-4 w-4" />
        Search Listings
      </button>
    </div>
  );
}
