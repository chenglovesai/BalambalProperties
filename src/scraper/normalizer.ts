import { DISTRICT_MAP, PROPERTY_TYPE_MAP } from "./config";
import { createLogger } from "./logger";
import type { RawListing } from "./types";

const log = createLogger("normalizer");

export interface NormalizedProperty {
  canonicalId: string;
  title: string;
  titleZh: string | null;
  description: string;
  descriptionZh: string | null;
  district: string;
  address: string;
  propertyType: string;
  saleableArea: number | null;
  grossArea: number | null;
  monthlyRent: number | null;
  psfRent: number | null;
  managementFee: number | null;
  price: number | null;
  floor: string | null;
  images: string[];
  floorPlanUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  features: Record<string, unknown> | null;
  buildingName: string | null;
  mtrProximity: string | null;
  mtrStation: string | null;
  hasExhaust: boolean;
  loadingAccess: boolean;
  source: string;
  sourceUrl: string | null;
  rawData: Record<string, unknown>;
  agentName: string | null;
  agentContact: string | null;
  agentCompany: string | null;
}

export function normalizeDistrict(raw: string | undefined): string {
  if (!raw) return "Unknown";
  const lower = raw.toLowerCase().trim();

  if (DISTRICT_MAP[lower]) return DISTRICT_MAP[lower];

  for (const [key, value] of Object.entries(DISTRICT_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }

  return raw.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function normalizePropertyType(raw: string | undefined): string {
  if (!raw) return "office";
  const lower = raw.toLowerCase().trim();

  if (PROPERTY_TYPE_MAP[lower]) return PROPERTY_TYPE_MAP[lower];

  for (const [key, value] of Object.entries(PROPERTY_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }

  return "office";
}

export function generateCanonicalId(listing: RawListing): string {
  const district = normalizeDistrict(listing.district).replace(/\s+/g, "").toUpperCase();
  const address = (listing.address || listing.buildingName || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 20);
  const area = listing.grossAreaSqft || listing.saleableAreaSqft || 0;
  const floor = (listing.floor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);

  return `HK-${district}-${address}-${Math.round(area)}-${floor}`.replace(/-+$/, "");
}

export function normalizeListing(raw: RawListing): NormalizedProperty {
  const district = normalizeDistrict(raw.district);
  const propertyType = normalizePropertyType(raw.propertyType);
  const canonicalId = generateCanonicalId(raw);

  const saleableAreaSqft = raw.saleableAreaSqft ?? null;
  const grossAreaSqft = raw.grossAreaSqft ?? null;

  let monthlyRent = raw.monthlyRent ?? null;
  let psfRent = raw.psfRent ?? null;
  const price = raw.salePrice ?? null;

  if (monthlyRent && !psfRent && (saleableAreaSqft || grossAreaSqft)) {
    const area = saleableAreaSqft || grossAreaSqft!;
    psfRent = Math.round((monthlyRent / area) * 100) / 100;
  }

  if (psfRent && !monthlyRent && (saleableAreaSqft || grossAreaSqft)) {
    const area = saleableAreaSqft || grossAreaSqft!;
    monthlyRent = Math.round(psfRent * area);
  }

  const description = raw.description
    || buildDescription(raw, district, propertyType)
    || `${propertyType} property in ${district}`;

  const mtrProximity = raw.features.mtrProximity as string | undefined;
  const mtrMatch = mtrProximity?.match(/(\d+)\s*min\s*-\s*(.+)/i);
  const hasExhaust = !!(raw.features.exhaustSystem || raw.features.exhaustDuct || raw.features.basicExhaust || raw.features.exhaust_system);
  const loadingAccess = !!(raw.features.loadingAccess || raw.features.loadingDock || raw.features.loading_dock || raw.features.loading_access);

  return {
    canonicalId,
    title: raw.title || `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} in ${district}`,
    titleZh: raw.titleZh || null,
    description,
    descriptionZh: raw.descriptionZh || null,
    district,
    address: raw.address || district,
    propertyType,
    saleableArea: saleableAreaSqft,
    grossArea: grossAreaSqft,
    monthlyRent,
    psfRent,
    managementFee: raw.managementFee ?? null,
    price,
    floor: raw.floor || null,
    images: raw.images.filter((img) => img.startsWith("http")),
    floorPlanUrl: null,
    latitude: null,
    longitude: null,
    features: Object.keys(raw.features).length > 0 ? raw.features : null,
    buildingName: raw.buildingName || null,
    mtrProximity: mtrMatch ? `${mtrMatch[1]} min walk` : (raw.features.mtrNearby ? "Near MTR" : null),
    mtrStation: mtrMatch?.[2]?.replace(/\s*Station\s*/i, "").trim() || null,
    hasExhaust,
    loadingAccess,
    source: raw.source,
    sourceUrl: raw.sourceUrl || null,
    rawData: raw.rawData,
    agentName: raw.agentName || null,
    agentContact: raw.agentContact || null,
    agentCompany: raw.agentCompany || null,
  };
}

function buildDescription(raw: RawListing, district: string, propertyType: string): string {
  const parts: string[] = [];

  parts.push(`${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} property in ${district}.`);

  if (raw.buildingName) parts.push(`Located in ${raw.buildingName}.`);
  if (raw.floor) parts.push(`Floor: ${raw.floor}.`);

  const area = raw.grossAreaSqft || raw.saleableAreaSqft;
  if (area) parts.push(`Approximately ${area.toLocaleString()} sq ft.`);

  if (raw.monthlyRent) parts.push(`Monthly rent: HKD $${raw.monthlyRent.toLocaleString()}.`);
  if (raw.salePrice) parts.push(`Sale price: HKD $${raw.salePrice.toLocaleString()}.`);

  const featureList = Object.keys(raw.features);
  if (featureList.length > 0) {
    const readable = featureList
      .slice(0, 5)
      .map((f) => f.replace(/_/g, " "));
    parts.push(`Features: ${readable.join(", ")}.`);
  }

  return parts.join(" ");
}

export function deduplicateListings(listings: RawListing[]): RawListing[] {
  const seen = new Map<string, RawListing>();

  for (const listing of listings) {
    const canonicalId = generateCanonicalId(listing);
    const existing = seen.get(canonicalId);

    if (!existing) {
      seen.set(canonicalId, listing);
      continue;
    }

    const existingScore = scoreCompleteness(existing);
    const newScore = scoreCompleteness(listing);

    if (newScore > existingScore) {
      seen.set(canonicalId, listing);
    }
  }

  const deduped = Array.from(seen.values());
  const removed = listings.length - deduped.length;
  if (removed > 0) {
    log.info(`Deduplication: ${listings.length} -> ${deduped.length} (removed ${removed} duplicates)`);
  }
  return deduped;
}

function scoreCompleteness(listing: RawListing): number {
  let score = 0;
  if (listing.title) score += 2;
  if (listing.description) score += 2;
  if (listing.district) score += 1;
  if (listing.address) score += 1;
  if (listing.grossAreaSqft) score += 1;
  if (listing.saleableAreaSqft) score += 1;
  if (listing.monthlyRent) score += 1;
  if (listing.salePrice) score += 1;
  if (listing.floor) score += 1;
  if (listing.images.length > 0) score += 2;
  if (listing.agentName) score += 1;
  if (listing.agentContact) score += 1;
  if (Object.keys(listing.features).length > 0) score += 1;
  return score;
}
