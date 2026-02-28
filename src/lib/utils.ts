import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString()} sq ft`;
}

export function formatPsf(amount: number): string {
  return `HK$${amount.toFixed(0)}/sq ft`;
}

export function getVerificationColor(status: string): string {
  switch (status) {
    case "verified":
      return "text-green-600 bg-green-50 border-green-200";
    case "pending":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "unconfirmed":
      return "text-gray-500 bg-gray-50 border-gray-200";
    default:
      return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

export function getRiskColor(status: string): string {
  switch (status) {
    case "pass":
      return "text-green-700 bg-green-50 border-green-200";
    case "fail":
      return "text-red-700 bg-red-50 border-red-200";
    case "risk":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "unknown":
      return "text-gray-500 bg-gray-50 border-gray-200";
    default:
      return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

export function getRiskIcon(status: string): string {
  switch (status) {
    case "pass":
      return "check-circle";
    case "fail":
      return "x-circle";
    case "risk":
      return "alert-triangle";
    case "unknown":
      return "help-circle";
    default:
      return "help-circle";
  }
}

export const HK_DISTRICTS = [
  "Central",
  "Wan Chai",
  "Causeway Bay",
  "North Point",
  "Quarry Bay",
  "Tai Koo",
  "Sheung Wan",
  "Sai Ying Pun",
  "Kennedy Town",
  "Aberdeen",
  "Tsim Sha Tsui",
  "Mong Kok",
  "Yau Ma Tei",
  "Jordan",
  "Sham Shui Po",
  "Cheung Sha Wan",
  "Lai Chi Kok",
  "Kwun Tong",
  "Kwai Chung",
  "Tsuen Wan",
  "Tuen Mun",
  "Yuen Long",
  "Sha Tin",
  "Fo Tan",
  "Tai Po",
  "Fanling",
] as const;

export const PROPERTY_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "fnb", label: "F&B" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "industrial", label: "Industrial" },
] as const;

export const BUSINESS_TYPES = [
  { value: "fnb", label: "Food & Beverage" },
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse / Logistics" },
  { value: "other", label: "Other" },
] as const;
