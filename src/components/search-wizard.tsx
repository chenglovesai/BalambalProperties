"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Building2,
  UtensilsCrossed,
  Warehouse,
  ShoppingBag,
  CookingPot,
  Microscope,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Ruler,
  MapPin,
  Clock,
  Send,
  Loader2,
  Search,
  Check,
  MessageSquare,
  Sparkles,
  Train,
  Car,
  Truck,
  ShieldCheck,
  Wrench,
  SkipForward,
  Users,
  Eye,
  Wind,
  Flame,
  Footprints,
  FileText,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SpaceType =
  | "office"
  | "restaurant"
  | "kitchen"
  | "warehouse"
  | "retail"
  | "specialised";

type ListingType = "buy" | "rent" | "mortgage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface WizardState {
  spaceType: SpaceType | null;
  listingTypes: ListingType[];
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  location: string;
  selectedDistricts: string[];
  leaseDuration: string;
  // Requirements (screen 3) — keyed generically so each space-type can store its own
  requirements: Record<string, string | string[]>;
  // Non-negotiables (screen 4)
  nonNegotiables: string[];
  nonNegotiableFreeText: string;
  amenities: string[];
  readyTimeline: string;
  flexibility: boolean;
  willingToRenovate: string;
  // Chat
  chatMessages: ChatMessage[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPACE_TYPES: {
  id: SpaceType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { id: "office", label: "Office Space", icon: Building2, desc: "Corporate & professional workspace" },
  { id: "restaurant", label: "Restaurant / F&B", icon: UtensilsCrossed, desc: "Dining & food service venues" },
  { id: "kitchen", label: "Kitchen / Central Kitchen", icon: CookingPot, desc: "Commercial cooking facilities" },
  { id: "warehouse", label: "Warehouse", icon: Warehouse, desc: "Storage & logistics space" },
  { id: "retail", label: "Retail Shop", icon: ShoppingBag, desc: "Street-level retail & showrooms" },
  { id: "specialised", label: "Specialised Facilities", icon: Microscope, desc: "Labs, studios, cold storage & more" },
];

const LISTING_TYPES: { id: ListingType; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "mortgage", label: "Mortgage" },
];

const DISTRICTS = [
  "Central",
  "Wan Chai",
  "Causeway Bay",
  "Sheung Wan",
  "Tsim Sha Tsui",
  "Mong Kok",
  "Kwun Tong",
  "Kwai Chung",
  "Tsuen Wan",
  "North Point",
  "Quarry Bay",
  "Wong Chuk Hang",
  "Sham Shui Po",
  "Yau Ma Tei",
  "Fanling",
  "Sha Tin",
];

const LEASE_DURATIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
  "Permanent",
];

const NON_NEGOTIABLE_OPTIONS = [
  "MTR within 5-min walk",
  "Ground floor access",
  "24-hour building access",
  "Dedicated parking",
  "Loading dock",
  "High ceiling (>12ft)",
  "Natural light / windows",
  "Exhaust system",
  "Grease trap",
  "Backup power generator",
  "Fiber internet",
  "Wheelchair accessible",
];

const AMENITY_OPTIONS = [
  { id: "mtr", label: "MTR proximity", icon: Train },
  { id: "parking", label: "Parking", icon: Car },
  { id: "loading", label: "Loading dock", icon: Truck },
  { id: "security", label: "24hr security", icon: ShieldCheck },
  { id: "maintenance", label: "On-site maintenance", icon: Wrench },
];

const READY_TIMELINES = [
  "Immediately",
  "Within 1 month",
  "1-3 months",
  "3-6 months",
  "6+ months",
  "Flexible",
];

const TOTAL_SCREENS = 5;

// ---------------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------------

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === current
              ? "w-8 bg-amber-500"
              : i < current
                ? "w-2 bg-amber-500/50"
                : "w-2 bg-white/10"
          )}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "border-amber-500 bg-amber-500/15 text-amber-400"
          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300"
      )}
    >
      {active && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </label>
  );
}

function DarkInput({
  placeholder,
  value,
  onChange,
  type = "text",
  icon: Icon,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors",
          Icon && "pl-10"
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen components
// ---------------------------------------------------------------------------

function WelcomeScreen({
  state,
  onUpdate,
}: {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
}) {
  function toggleListing(id: ListingType) {
    const current = state.listingTypes;
    onUpdate({
      listingTypes: current.includes(id)
        ? current.filter((t) => t !== id)
        : [...current, id],
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">
          What type of commercial space are you looking for?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Select the category that best fits your business needs.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SPACE_TYPES.map((st) => {
          const Icon = st.icon;
          const active = state.spaceType === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onUpdate({ spaceType: st.id })}
              className={cn(
                "group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                active
                  ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-amber-500 text-black" : "bg-white/10 text-gray-400 group-hover:text-gray-300"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className={cn("text-sm font-semibold", active ? "text-amber-400" : "text-white")}>
                  {st.label}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">{st.desc}</div>
              </div>
              {active && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <FieldLabel>Listing Type</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {LISTING_TYPES.map((lt) => {
            const active = state.listingTypes.includes(lt.id);
            return (
              <button
                key={lt.id}
                type="button"
                onClick={() => toggleListing(lt.id)}
                className={cn(
                  "rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-gray-300"
                )}
              >
                {active && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                {lt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BudgetSizeScreen({
  state,
  onUpdate,
}: {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
}) {
  function toggleDistrict(d: string) {
    const current = state.selectedDistricts;
    onUpdate({
      selectedDistricts: current.includes(d)
        ? current.filter((x) => x !== d)
        : [...current, d],
    });
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-white">Budget & Size</h2>
        <p className="mt-2 text-sm text-gray-500">
          Help us narrow down the right options for you.
        </p>
      </div>

      {/* Price range */}
      <div>
        <FieldLabel>
          <DollarSign className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          Price Range (HKD)
        </FieldLabel>
        <div className="flex items-center gap-3">
          <DarkInput
            placeholder="Min"
            value={state.minPrice}
            onChange={(v) => onUpdate({ minPrice: v })}
            type="number"
          />
          <span className="text-gray-600">—</span>
          <DarkInput
            placeholder="Max"
            value={state.maxPrice}
            onChange={(v) => onUpdate({ maxPrice: v })}
            type="number"
          />
        </div>
      </div>

      {/* Area */}
      <div>
        <FieldLabel>
          <Ruler className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          Square Footage (sqft)
        </FieldLabel>
        <div className="flex items-center gap-3">
          <DarkInput
            placeholder="Min"
            value={state.minArea}
            onChange={(v) => onUpdate({ minArea: v })}
            type="number"
          />
          <span className="text-gray-600">—</span>
          <DarkInput
            placeholder="Max"
            value={state.maxArea}
            onChange={(v) => onUpdate({ maxArea: v })}
            type="number"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <FieldLabel>
          <MapPin className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          Location Preference
        </FieldLabel>
        <DarkInput
          placeholder="Type a district or area name..."
          value={state.location}
          onChange={(v) => onUpdate({ location: v })}
          icon={MapPin}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <Chip
              key={d}
              label={d}
              active={state.selectedDistricts.includes(d)}
              onClick={() => toggleDistrict(d)}
            />
          ))}
        </div>
      </div>

      {/* Lease duration */}
      <div>
        <FieldLabel>
          <Clock className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          How long do you intend to use the property?
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {LEASE_DURATIONS.map((d) => (
            <Chip
              key={d}
              label={d}
              active={state.leaseDuration === d}
              onClick={() => onUpdate({ leaseDuration: state.leaseDuration === d ? "" : d })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 3 — Space-specific requirements
// ---------------------------------------------------------------------------

function getReqValue(state: WizardState, key: string, fallback: string = ""): string {
  const v = state.requirements[key];
  return typeof v === "string" ? v : fallback;
}

function getReqArray(state: WizardState, key: string): string[] {
  const v = state.requirements[key];
  return Array.isArray(v) ? v : [];
}

function setReq(state: WizardState, key: string, value: string | string[]): Record<string, string | string[]> {
  return { ...state.requirements, [key]: value };
}

function toggleReqChip(state: WizardState, key: string, value: string): Record<string, string | string[]> {
  const arr = getReqArray(state, key);
  const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  return setReq(state, key, next);
}

function OfficeRequirements({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  const envOptions = ["Open plan", "Private offices", "Hybrid", "Executive suite", "Hot-desking"];
  const viewOptions = ["Harbour view", "City view", "Mountain view", "No preference"];

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel><Users className="mr-1 inline h-3.5 w-3.5 text-amber-500" />How many people will use the space?</FieldLabel>
        <DarkInput
          placeholder="e.g. 15"
          value={getReqValue(state, "headcount")}
          onChange={(v) => onUpdate({ requirements: setReq(state, "headcount", v) })}
          type="number"
        />
      </div>
      <div>
        <FieldLabel>Office environment type</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {envOptions.map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "officeEnv") === o} onClick={() => onUpdate({ requirements: setReq(state, "officeEnv", getReqValue(state, "officeEnv") === o ? "" : o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel><Eye className="mr-1 inline h-3.5 w-3.5 text-amber-500" />Any particular view needed?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "officeView") === o} onClick={() => onUpdate({ requirements: setReq(state, "officeView", getReqValue(state, "officeView") === o ? "" : o) })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WarehouseRequirements({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  const goodsOptions = ["General goods", "Chilled / refrigerated", "Hazardous materials", "E-commerce stock", "Heavy machinery"];
  const loadingOptions = ["Loading dock required", "Freight elevator", "Container truck access", "Forklift access", "No special needs"];

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel><Package className="mr-1 inline h-3.5 w-3.5 text-amber-500" />What goods will be stored?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {goodsOptions.map((o) => (
            <Chip key={o} label={o} active={getReqArray(state, "warehouseGoods").includes(o)} onClick={() => onUpdate({ requirements: toggleReqChip(state, "warehouseGoods", o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel><Truck className="mr-1 inline h-3.5 w-3.5 text-amber-500" />Loading requirements</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {loadingOptions.map((o) => (
            <Chip key={o} label={o} active={getReqArray(state, "warehouseLoading").includes(o)} onClick={() => onUpdate({ requirements: toggleReqChip(state, "warehouseLoading", o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Temperature requirements</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Ambient (no control)", "Air-conditioned", "Chilled (0-8°C)", "Frozen (-18°C or below)"].map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "warehouseTemp") === o} onClick={() => onUpdate({ requirements: setReq(state, "warehouseTemp", getReqValue(state, "warehouseTemp") === o ? "" : o) })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FnbRequirements({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  const kitchenOptions = ["Full commercial kitchen", "Prep kitchen only", "Open kitchen", "No kitchen needed"];
  const exhaustOptions = ["Existing exhaust system", "Need new exhaust installation", "Low-smoke operation", "Unsure"];
  const cuisineOptions = ["Chinese", "Western", "Japanese", "Korean", "Southeast Asian", "Fusion", "Café / Bakery", "Bar / Lounge"];

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel><Flame className="mr-1 inline h-3.5 w-3.5 text-amber-500" />Kitchen needs</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {kitchenOptions.map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "fnbKitchen") === o} onClick={() => onUpdate({ requirements: setReq(state, "fnbKitchen", getReqValue(state, "fnbKitchen") === o ? "" : o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel><Wind className="mr-1 inline h-3.5 w-3.5 text-amber-500" />Exhaust requirements</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {exhaustOptions.map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "fnbExhaust") === o} onClick={() => onUpdate({ requirements: setReq(state, "fnbExhaust", getReqValue(state, "fnbExhaust") === o ? "" : o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Type of cuisine / concept</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((o) => (
            <Chip key={o} label={o} active={getReqArray(state, "fnbCuisine").includes(o)} onClick={() => onUpdate({ requirements: toggleReqChip(state, "fnbCuisine", o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel><Eye className="mr-1 inline h-3.5 w-3.5 text-amber-500" />View preference</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Street-facing", "Harbour view", "Indoor mall", "No preference"].map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "fnbView") === o} onClick={() => onUpdate({ requirements: setReq(state, "fnbView", getReqValue(state, "fnbView") === o ? "" : o) })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RetailRequirements({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Frontage requirements</FieldLabel>
        <DarkInput
          placeholder="e.g. Minimum 20ft street frontage"
          value={getReqValue(state, "retailFrontage")}
          onChange={(v) => onUpdate({ requirements: setReq(state, "retailFrontage", v) })}
        />
      </div>
      <div>
        <FieldLabel><Footprints className="mr-1 inline h-3.5 w-3.5 text-amber-500" />How important is pedestrian traffic?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Critical — must be high-traffic", "Important but not essential", "Low traffic is fine", "Online-focused, foot traffic irrelevant"].map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "retailTraffic") === o} onClick={() => onUpdate({ requirements: setReq(state, "retailTraffic", getReqValue(state, "retailTraffic") === o ? "" : o) })} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Floor preference</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Ground floor only", "G/F or 1/F", "Basement OK", "Upper floors OK"].map((o) => (
            <Chip key={o} label={o} active={getReqValue(state, "retailFloor") === o} onClick={() => onUpdate({ requirements: setReq(state, "retailFloor", getReqValue(state, "retailFloor") === o ? "" : o) })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecialisedRequirements({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel><FileText className="mr-1 inline h-3.5 w-3.5 text-amber-500" />What will your facility be used for?</FieldLabel>
        <textarea
          placeholder="Describe your specialised facility needs in detail... (e.g. laboratory with fume hoods, recording studio with soundproofing, cold storage for pharmaceuticals)"
          value={getReqValue(state, "specialisedUse")}
          onChange={(e) => onUpdate({ requirements: setReq(state, "specialisedUse", e.target.value) })}
          rows={5}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
        />
      </div>
      <div>
        <FieldLabel>Special infrastructure</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["High power supply", "Water/drainage", "Ventilation/exhaust", "Soundproofing", "Reinforced flooring", "Clean room", "Temperature control"].map((o) => (
            <Chip key={o} label={o} active={getReqArray(state, "specialisedInfra").includes(o)} onClick={() => onUpdate({ requirements: toggleReqChip(state, "specialisedInfra", o) })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RequirementsScreen({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  const labels: Record<SpaceType, string> = {
    office: "Office",
    restaurant: "Restaurant / F&B",
    kitchen: "Kitchen / Central Kitchen",
    warehouse: "Warehouse",
    retail: "Retail",
    specialised: "Specialised Facility",
  };

  const spaceType = state.spaceType ?? "office";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {labels[spaceType]} Requirements
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Tell us more about your specific needs for this type of space.
        </p>
      </div>

      {spaceType === "office" && <OfficeRequirements state={state} onUpdate={onUpdate} />}
      {spaceType === "warehouse" && <WarehouseRequirements state={state} onUpdate={onUpdate} />}
      {(spaceType === "restaurant" || spaceType === "kitchen") && <FnbRequirements state={state} onUpdate={onUpdate} />}
      {spaceType === "retail" && <RetailRequirements state={state} onUpdate={onUpdate} />}
      {spaceType === "specialised" && <SpecialisedRequirements state={state} onUpdate={onUpdate} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 4 — Non-negotiables
// ---------------------------------------------------------------------------

function NonNegotiablesScreen({ state, onUpdate }: { state: WizardState; onUpdate: (p: Partial<WizardState>) => void }) {
  function toggleNN(v: string) {
    const arr = state.nonNegotiables;
    onUpdate({ nonNegotiables: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] });
  }
  function toggleAmenity(id: string) {
    const arr = state.amenities;
    onUpdate({ amenities: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] });
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-white">Non-negotiables & Preferences</h2>
        <p className="mt-2 text-sm text-gray-500">
          What absolutely must be in place? This helps us filter out unsuitable options.
        </p>
      </div>

      {/* Non-negotiables chips */}
      <div>
        <FieldLabel>
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          What are your non-negotiables?
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {NON_NEGOTIABLE_OPTIONS.map((o) => (
            <Chip key={o} label={o} active={state.nonNegotiables.includes(o)} onClick={() => toggleNN(o)} />
          ))}
        </div>
        <div className="mt-3">
          <DarkInput
            placeholder="Other non-negotiables..."
            value={state.nonNegotiableFreeText}
            onChange={(v) => onUpdate({ nonNegotiableFreeText: v })}
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <FieldLabel>What amenities do you need access to?</FieldLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITY_OPTIONS.map((a) => {
            const Icon = a.icon;
            const active = state.amenities.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAmenity(a.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-all duration-200",
                  active
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-amber-500" : "text-gray-600")} />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ready timeline */}
      <div>
        <FieldLabel>
          <Clock className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          How quickly do you need the property ready?
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {READY_TIMELINES.map((t) => (
            <Chip key={t} label={t} active={state.readyTimeline === t} onClick={() => onUpdate({ readyTimeline: state.readyTimeline === t ? "" : t })} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-gray-500">Timeline flexible?</span>
          <button
            type="button"
            onClick={() => onUpdate({ flexibility: !state.flexibility })}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors duration-200",
              state.flexibility ? "bg-amber-500" : "bg-white/10"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                state.flexibility ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Renovations */}
      <div>
        <FieldLabel>
          <Wrench className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
          Are you willing to make renovations within your budget?
        </FieldLabel>
        <div className="flex gap-2">
          {["Yes", "No", "Depends on cost"].map((o) => (
            <Chip key={o} label={o} active={state.willingToRenovate === o} onClick={() => onUpdate({ willingToRenovate: state.willingToRenovate === o ? "" : o })} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen 5 — AI Chat
// ---------------------------------------------------------------------------

function buildSummary(state: WizardState): string {
  const lines: string[] = [];

  if (state.spaceType) {
    const label = SPACE_TYPES.find((s) => s.id === state.spaceType)?.label;
    lines.push(`Space type: ${label}`);
  }
  if (state.listingTypes.length) {
    lines.push(`Listing: ${state.listingTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}`);
  }
  if (state.minPrice || state.maxPrice) {
    lines.push(`Budget: HK$${state.minPrice || "0"} – ${state.maxPrice || "any"}`);
  }
  if (state.minArea || state.maxArea) {
    lines.push(`Area: ${state.minArea || "0"} – ${state.maxArea || "any"} sqft`);
  }
  if (state.selectedDistricts.length) {
    lines.push(`Districts: ${state.selectedDistricts.join(", ")}`);
  } else if (state.location) {
    lines.push(`Location: ${state.location}`);
  }
  if (state.leaseDuration) {
    lines.push(`Lease: ${state.leaseDuration}`);
  }
  if (state.nonNegotiables.length) {
    lines.push(`Must-haves: ${state.nonNegotiables.join(", ")}`);
  }
  if (state.amenities.length) {
    const labels = state.amenities.map((id) => AMENITY_OPTIONS.find((a) => a.id === id)?.label ?? id);
    lines.push(`Amenities: ${labels.join(", ")}`);
  }
  if (state.readyTimeline) {
    lines.push(`Timeline: ${state.readyTimeline}${state.flexibility ? " (flexible)" : ""}`);
  }
  if (state.willingToRenovate) {
    lines.push(`Renovations: ${state.willingToRenovate}`);
  }

  // Space-specific requirements summary
  const reqs = state.requirements;
  if (reqs.headcount) lines.push(`Headcount: ${reqs.headcount}`);
  if (reqs.officeEnv) lines.push(`Office style: ${reqs.officeEnv}`);
  if (reqs.officeView) lines.push(`View: ${reqs.officeView}`);
  if (Array.isArray(reqs.warehouseGoods) && reqs.warehouseGoods.length) lines.push(`Goods: ${reqs.warehouseGoods.join(", ")}`);
  if (Array.isArray(reqs.warehouseLoading) && reqs.warehouseLoading.length) lines.push(`Loading: ${reqs.warehouseLoading.join(", ")}`);
  if (reqs.warehouseTemp) lines.push(`Temp: ${reqs.warehouseTemp}`);
  if (reqs.fnbKitchen) lines.push(`Kitchen: ${reqs.fnbKitchen}`);
  if (reqs.fnbExhaust) lines.push(`Exhaust: ${reqs.fnbExhaust}`);
  if (Array.isArray(reqs.fnbCuisine) && reqs.fnbCuisine.length) lines.push(`Cuisine: ${reqs.fnbCuisine.join(", ")}`);
  if (reqs.fnbView) lines.push(`F&B view: ${reqs.fnbView}`);
  if (reqs.retailFrontage) lines.push(`Frontage: ${reqs.retailFrontage}`);
  if (reqs.retailTraffic) lines.push(`Traffic: ${reqs.retailTraffic}`);
  if (reqs.retailFloor) lines.push(`Floor: ${reqs.retailFloor}`);
  if (reqs.specialisedUse) lines.push(`Use: ${reqs.specialisedUse}`);
  if (Array.isArray(reqs.specialisedInfra) && reqs.specialisedInfra.length) lines.push(`Infrastructure: ${reqs.specialisedInfra.join(", ")}`);

  return lines.length ? lines.join("\n") : "No requirements collected yet.";
}

function AiChatScreen({
  state,
  onUpdate,
  onSearch,
}: {
  state: WizardState;
  onUpdate: (p: Partial<WizardState>) => void;
  onSearch: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.chatMessages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const updated = [...state.chatMessages, { role: "user" as const, content: text }];
    onUpdate({ chatMessages: updated });
    setLoading(true);

    try {
      const res = await fetch("/api/ai/parse-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          context: buildSummary(state),
        }),
      });

      if (res.ok) {
        const parsed = await res.json();
        const parts: string[] = [];
        if (parsed.filters?.districts?.length) parts.push(`I identified districts: ${parsed.filters.districts.join(", ")}`);
        if (parsed.filters?.propertyTypes?.length) parts.push(`Property types: ${parsed.filters.propertyTypes.join(", ")}`);
        if (parsed.filters?.minRent || parsed.filters?.maxRent)
          parts.push(`Budget range: HK$${parsed.filters.minRent?.toLocaleString() || "0"} – ${parsed.filters.maxRent?.toLocaleString() || "any"}/mo`);

        const reply = parts.length
          ? parts.join("\n") + "\n\nI've noted these preferences. Feel free to refine or click **Search Properties** when ready."
          : "I understand. Could you provide more specifics — like a preferred district, budget range, or floor area? That helps me find better matches.";

        onUpdate({ chatMessages: [...updated, { role: "assistant", content: reply }] });
      } else {
        onUpdate({ chatMessages: [...updated, { role: "assistant", content: "I had trouble processing that. Try rephrasing or providing more detail about location, budget, or size." }] });
      }
    } catch {
      onUpdate({ chatMessages: [...updated, { role: "assistant", content: "Connection issue — please try again." }] });
    } finally {
      setLoading(false);
    }
  }

  const summary = buildSummary(state);
  const suggestions = [
    "I need high ceilings and natural light",
    "Somewhere close to Central MTR",
    "Budget is flexible if the space is right",
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Summary panel */}
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
          <Sparkles className="h-3.5 w-3.5" />
          Your Requirements Summary
        </div>
        <pre className="max-h-28 overflow-y-auto text-xs leading-relaxed text-gray-400 whitespace-pre-wrap font-sans">
          {summary}
        </pre>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {state.chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <MessageSquare className="h-6 w-6 text-amber-500" />
            </div>
            <h4 className="mt-4 text-sm font-semibold text-white">Refine your search with AI</h4>
            <p className="mt-1 max-w-[300px] text-xs text-gray-500">
              Ask follow-up questions, add details, or let me help narrow down the perfect property.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-amber-500/30 hover:text-amber-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.chatMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-amber-500 text-black"
                : "bg-white/5 border border-white/10 text-gray-300"
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-500 max-w-[85%]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
            Thinking...
          </div>
        )}
      </div>

      {/* Input + search */}
      <div className="border-t border-white/10 bg-[#111] px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Add details or ask a question..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500 text-black transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
        >
          <Search className="h-4 w-4" />
          Search Properties
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard export
// ---------------------------------------------------------------------------

const INITIAL_STATE: WizardState = {
  spaceType: null,
  listingTypes: [],
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  location: "",
  selectedDistricts: [],
  leaseDuration: "",
  requirements: {},
  nonNegotiables: [],
  nonNegotiableFreeText: "",
  amenities: [],
  readyTimeline: "",
  flexibility: false,
  willingToRenovate: "",
  chatMessages: [],
};

export function SearchWizard({
  onSearch,
}: {
  onSearch?: (filters: Record<string, unknown>) => void;
}) {
  const [screen, setScreen] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [direction, setDirection] = useState<1 | -1>(1);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  function go(delta: 1 | -1) {
    setDirection(delta);
    setScreen((s) => Math.max(0, Math.min(TOTAL_SCREENS - 1, s + delta)));
  }

  function handleSearch() {
    const filters: Record<string, unknown> = {
      spaceType: state.spaceType,
      listingTypes: state.listingTypes,
      minPrice: state.minPrice || undefined,
      maxPrice: state.maxPrice || undefined,
      minArea: state.minArea || undefined,
      maxArea: state.maxArea || undefined,
      location: state.location || undefined,
      districts: state.selectedDistricts.length ? state.selectedDistricts : undefined,
      leaseDuration: state.leaseDuration || undefined,
      requirements: Object.keys(state.requirements).length ? state.requirements : undefined,
      nonNegotiables: state.nonNegotiables.length ? state.nonNegotiables : undefined,
      amenities: state.amenities.length ? state.amenities : undefined,
      readyTimeline: state.readyTimeline || undefined,
      flexibility: state.flexibility,
      willingToRenovate: state.willingToRenovate || undefined,
    };
    onSearch?.(filters);
  }

  const isLastScreen = screen === TOTAL_SCREENS - 1;
  const isFirstScreen = screen === 0;

  const screenLabels = ["Space Type", "Budget & Size", "Requirements", "Preferences", "AI Chat"];

  return (
    <div className="flex h-full flex-col bg-[#111] text-white">
      {/* Header with progress */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#111] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Step {screen + 1} of {TOTAL_SCREENS}
            </div>
            <div className="mt-0.5 text-sm font-medium text-gray-400">
              {screenLabels[screen]}
            </div>
          </div>
          <ProgressDots current={screen} total={TOTAL_SCREENS} />
        </div>
      </div>

      {/* Screen content */}
      <div
        key={screen}
        className={cn(
          "flex-1 overflow-y-auto",
          screen === TOTAL_SCREENS - 1 ? "" : "px-6 py-6",
          "animate-in fade-in",
          direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4"
        )}
        style={{ animationDuration: "250ms" }}
      >
        {screen === 0 && <WelcomeScreen state={state} onUpdate={update} />}
        {screen === 1 && <BudgetSizeScreen state={state} onUpdate={update} />}
        {screen === 2 && <RequirementsScreen state={state} onUpdate={update} />}
        {screen === 3 && <NonNegotiablesScreen state={state} onUpdate={update} />}
        {screen === 4 && <AiChatScreen state={state} onUpdate={update} onSearch={handleSearch} />}
      </div>

      {/* Navigation footer (hidden on chat screen which has its own CTA) */}
      {!isLastScreen && (
        <div className="flex-shrink-0 border-t border-white/10 bg-[#111] px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={isFirstScreen}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isFirstScreen
                  ? "text-gray-700 cursor-not-allowed"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {screen < TOTAL_SCREENS - 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setDirection(1);
                    setScreen(TOTAL_SCREENS - 1);
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-400"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip to Chat
                </button>
              )}
              <button
                type="button"
                onClick={() => go(1)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
