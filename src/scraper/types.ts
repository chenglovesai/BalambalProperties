export interface RawListing {
  sourceId: string;
  source: string;
  sourceUrl: string;
  title: string;
  titleZh?: string;
  description?: string;
  descriptionZh?: string;
  district?: string;
  address?: string;
  buildingName?: string;
  propertyType?: string;
  transactionType: "rent" | "sale" | "both";
  saleableAreaSqft?: number;
  grossAreaSqft?: number;
  monthlyRent?: number;
  psfRent?: number;
  salePrice?: number;
  psfPrice?: number;
  managementFee?: number;
  floor?: string;
  images: string[];
  agentName?: string;
  agentContact?: string;
  agentCompany?: string;
  agentLicense?: string;
  features: Record<string, unknown>;
  rawData: Record<string, unknown>;
  scrapedAt: Date;
}

export interface ScraperResult {
  source: string;
  listings: RawListing[];
  errors: ScraperError[];
  pagesScraped: number;
  duration: number;
}

export interface ScraperError {
  url: string;
  message: string;
  timestamp: Date;
}

export interface ScraperStats {
  totalListings: number;
  newListings: number;
  updatedListings: number;
  errors: number;
  duration: number;
  sources: Record<string, { listings: number; errors: number }>;
}

export type PropertyCategory = "office" | "retail" | "industrial" | "fnb" | "warehouse";

export type HKRegion = "hk_island" | "kowloon" | "new_territories" | "outlying_islands";

export interface ScrapeOptions {
  fullScan: boolean;
  maxPagesPerCategory: number;
  delayBetweenRequests: number;
}
