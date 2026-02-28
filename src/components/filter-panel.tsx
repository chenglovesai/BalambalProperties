"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { HK_DISTRICTS, PROPERTY_TYPES, formatCurrency, formatArea } from "@/lib/utils";

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentDistricts = searchParams.get("districts")?.split(",").filter(Boolean) || [];
  const currentTypes = searchParams.get("types")?.split(",").filter(Boolean) || [];
  const currentMinRent = Number(searchParams.get("minRent")) || 0;
  const currentMaxRent = Number(searchParams.get("maxRent")) || 200000;
  const currentMinArea = Number(searchParams.get("minArea")) || 0;
  const currentMaxArea = Number(searchParams.get("maxArea")) || 10000;

  const [districts, setDistricts] = useState<string[]>(currentDistricts);
  const [types, setTypes] = useState<string[]>(currentTypes);
  const [rentRange, setRentRange] = useState([currentMinRent, currentMaxRent]);
  const [areaRange, setAreaRange] = useState([currentMinArea, currentMaxArea]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (districts.length) params.set("districts", districts.join(","));
    else params.delete("districts");

    if (types.length) params.set("types", types.join(","));
    else params.delete("types");

    if (rentRange[0] > 0) params.set("minRent", String(rentRange[0]));
    else params.delete("minRent");

    if (rentRange[1] < 200000) params.set("maxRent", String(rentRange[1]));
    else params.delete("maxRent");

    if (areaRange[0] > 0) params.set("minArea", String(areaRange[0]));
    else params.delete("minArea");

    if (areaRange[1] < 10000) params.set("maxArea", String(areaRange[1]));
    else params.delete("maxArea");

    router.push(`/search?${params.toString()}`);
    setIsOpen(false);
  }, [districts, types, rentRange, areaRange, searchParams, router]);

  const clearFilters = useCallback(() => {
    setDistricts([]);
    setTypes([]);
    setRentRange([0, 200000]);
    setAreaRange([0, 10000]);
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
    setIsOpen(false);
  }, [searchParams, router]);

  const activeCount =
    (districts.length > 0 ? 1 : 0) +
    (types.length > 0 ? 1 : 0) +
    (rentRange[0] > 0 || rentRange[1] < 200000 ? 1 : 0) +
    (areaRange[0] > 0 || areaRange[1] < 10000 ? 1 : 0);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-xl border bg-card p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="mb-2 block font-medium">Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <Checkbox
                      checked={types.includes(t.value)}
                      onCheckedChange={(checked) => {
                        setTypes(
                          checked
                            ? [...types, t.value]
                            : types.filter((v) => v !== t.value)
                        );
                      }}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block font-medium">
                Monthly Rent: {formatCurrency(rentRange[0])} - {formatCurrency(rentRange[1])}
              </Label>
              <Slider
                value={rentRange}
                onValueChange={setRentRange}
                min={0}
                max={200000}
                step={5000}
              />
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block font-medium">
                Area: {formatArea(areaRange[0])} - {formatArea(areaRange[1])}
              </Label>
              <Slider
                value={areaRange}
                onValueChange={setAreaRange}
                min={0}
                max={10000}
                step={100}
              />
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block font-medium">District</Label>
              <div className="max-h-48 overflow-y-auto space-y-1">
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
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Clear All
            </Button>
            <Button className="flex-1" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
