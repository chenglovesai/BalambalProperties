import type { Page } from "playwright";
import { SCRAPER_CONFIG } from "../config";
import type { RawListing, ScrapeOptions } from "../types";
import { BaseScraper } from "./base";

const config = SCRAPER_CONFIG.sources.twentyEightHse;

interface ListingCardData {
  id: string;
  url: string;
  title: string;
  district: string;
  buildingName: string;
  floor: string;
  grossArea: string;
  saleableArea: string;
  psfGross: string;
  psfSaleable: string;
  price: string;
  agentName: string;
  propertyType: string;
  features: string[];
  images: string[];
}

export class TwentyEightHseScraper extends BaseScraper {
  readonly sourceName = config.name;
  readonly baseUrl = config.baseUrl;

  protected async scrape(options: ScrapeOptions): Promise<{ listings: RawListing[]; pagesScraped: number }> {
    const allListings: RawListing[] = [];
    let totalPages = 0;

    const categories = [...config.rentCategories, ...config.saleCategories];

    for (const category of categories) {
      const isRent = config.rentCategories.includes(category as typeof config.rentCategories[number]);

      for (const region of config.regions) {
        const baseUrl = `${this.baseUrl}${category.path}/${region.id}`;
        this.log.info(`Scraping ${isRent ? "rent" : "sale"} ${category.type} in ${region.name}: ${baseUrl}`);

        const { listings, pages } = await this.scrapeCategory(
          baseUrl,
          category.type,
          isRent ? "rent" : "sale",
          options,
        );

        allListings.push(...listings);
        totalPages += pages;

        await this.delay(options.delayBetweenRequests);
      }
    }

    return { listings: allListings, pagesScraped: totalPages };
  }

  private async scrapeCategory(
    baseUrl: string,
    propertyType: string,
    transactionType: "rent" | "sale",
    options: ScrapeOptions,
  ): Promise<{ listings: RawListing[]; pages: number }> {
    const page = await this.newPage();
    const listings: RawListing[] = [];
    let pagesScraped = 0;

    try {
      let currentUrl = baseUrl;
      let hasMore = true;

      while (hasMore && pagesScraped < options.maxPagesPerCategory) {
        const ok = await this.navigateWithRetry(page, currentUrl);
        if (!ok) break;

        await page.waitForTimeout(1500);

        const cards = await this.extractListingCards(page);
        if (cards.length === 0) {
          this.log.debug(`No listings found on page ${pagesScraped + 1}, stopping.`);
          break;
        }

        for (const card of cards) {
          const listing = this.mapToRawListing(card, propertyType, transactionType);
          if (listing) listings.push(listing);
        }

        pagesScraped++;
        this.log.debug(`Page ${pagesScraped}: ${cards.length} listings (total: ${listings.length})`);

        const nextUrl = await this.getNextPageUrl(page, currentUrl, pagesScraped);
        if (!nextUrl) {
          hasMore = false;
        } else {
          currentUrl = nextUrl;
          await this.delay(options.delayBetweenRequests);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.recordError(baseUrl, msg);
    } finally {
      await page.close();
    }

    return { listings, pages: pagesScraped };
  }

  private async extractListingCards(page: Page): Promise<ListingCardData[]> {
    return page.evaluate(() => {
      const cards: ListingCardData[] = [];

      const propertyLinks = Array.from(document.querySelectorAll('a[href*="/property-"]'));
      const seen = new Set<string>();

      for (const link of propertyLinks) {
        const href = (link as HTMLAnchorElement).href;
        const idMatch = href.match(/property-(\d+)/);
        if (!idMatch || seen.has(idMatch[1])) continue;
        seen.add(idMatch[1]);

        const container = link.closest(".result_main, .searchResultList, [class*='listing'], [class*='property']")
          || link.parentElement?.parentElement?.parentElement;
        if (!container) continue;

        const text = container.textContent || "";
        const title = link.textContent?.trim() || "";

        const districtLink = container.querySelector('a[href*="/dg"], a[href*="/di"]');
        const district = districtLink?.textContent?.trim() || "";

        const buildingLink = container.querySelector('a[href*="/c"]');
        const buildingName = buildingLink?.textContent?.trim() || "";

        const grossMatch = text.match(/Gross Area:\s*([\d,]+)\s*ft²\s*@([\d.]+)/);
        const saleableMatch = text.match(/Saleable Area:\s*([\d,]+)\s*ft²\s*@([\d.]+)/);

        const priceMatch = text.match(/(?:Lease|Sale)\s+HKD?\$?([\d,]+(?:\.\d+)?[MBK]?)/i);

        const floorMatch = text.match(/(\d+\/F|G\/F|B\/F|[A-Z]+ Floor|High Floor|Middle Floor|Low Floor|Ground Floor)/i);

        const imgElements = Array.from(container.querySelectorAll("img[src]"));
        const images: string[] = [];
        for (const img of imgElements) {
          const src = (img as HTMLImageElement).src;
          if (src && !src.includes("avatar") && !src.includes("logo") && !src.includes("icon")) {
            images.push(src);
          }
        }

        const featureKeywords = [
          "Sea view", "Mountain view", "City view", "Garden view", "Good view",
          "Luxury", "Elegant", "Simple", "Sole Agent", "24 hours CCTV",
          "24 hours Entrance", "Independent toilet", "Independent air conditioner",
          "Dedicated Mailbox", "Whole floor", "Roof top", "Terrace",
          "Pet friendly", "Car Park",
        ];
        const features = featureKeywords.filter((kw) => text.includes(kw));

        const typeMatch = text.match(/(Commercial Office|Industrial Building|Shopping Mall Shop|Upstair Shop)/i);

        const agentEl = container.querySelector('[class*="agent"], [class*="contact"]');
        const agentName = agentEl?.textContent?.trim() || "";

        cards.push({
          id: idMatch[1],
          url: href,
          title,
          district,
          buildingName,
          floor: floorMatch?.[1] || "",
          grossArea: grossMatch?.[1] || "",
          saleableArea: saleableMatch?.[1] || "",
          psfGross: grossMatch?.[2] || "",
          psfSaleable: saleableMatch?.[2] || "",
          price: priceMatch?.[1] || "",
          agentName,
          propertyType: typeMatch?.[1] || "",
          features,
          images,
        });
      }

      return cards;
    });
  }

  private mapToRawListing(
    card: ListingCardData,
    categoryType: string,
    transactionType: "rent" | "sale",
  ): RawListing | null {
    if (!card.id) return null;

    const grossArea = this.parseNumber(card.grossArea);
    const saleableArea = this.parseNumber(card.saleableArea);
    const price = this.parseNumber(card.price);
    const psfGross = this.parseNumber(card.psfGross);

    let monthlyRent: number | undefined;
    let salePrice: number | undefined;
    let psfRent: number | undefined;
    let psfPriceVal: number | undefined;

    if (transactionType === "rent") {
      monthlyRent = price;
      psfRent = psfGross;
    } else {
      salePrice = price;
      psfPriceVal = psfGross;
    }

    const propertyType = this.mapPropertyType(card.propertyType || categoryType);

    return {
      sourceId: `28hse-${card.id}`,
      source: this.sourceName,
      sourceUrl: card.url.startsWith("http") ? card.url : `${this.baseUrl}${card.url}`,
      title: card.title || `${card.buildingName} - ${card.district}`,
      district: card.district,
      address: card.buildingName ? `${card.buildingName}, ${card.district}` : card.district,
      buildingName: card.buildingName,
      propertyType,
      transactionType,
      grossAreaSqft: grossArea,
      saleableAreaSqft: saleableArea,
      monthlyRent,
      psfRent,
      salePrice,
      psfPrice: psfPriceVal,
      floor: card.floor || undefined,
      images: card.images,
      agentName: card.agentName || undefined,
      features: this.mapFeatures(card.features),
      rawData: card as unknown as Record<string, unknown>,
      scrapedAt: new Date(),
    };
  }

  private async getNextPageUrl(page: Page, currentUrl: string, currentPage: number): Promise<string | null> {
    const nextUrl = await page.evaluate(() => {
      const nextLink = document.querySelector('a[class*="next"], a:has(> [class*="next"]), .pagination a.next, a[rel="next"]');
      return nextLink ? (nextLink as HTMLAnchorElement).href : null;
    });

    if (nextUrl) return nextUrl;

    const pageParam = currentUrl.includes("?") ? `&page=${currentPage + 1}` : `?page=${currentPage + 1}`;
    return `${currentUrl.replace(/[?&]page=\d+/, "")}${pageParam}`;
  }

  private mapPropertyType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("office") || lower.includes("commercial office")) return "office";
    if (lower.includes("shop") || lower.includes("retail")) return "retail";
    if (lower.includes("industrial")) return "industrial";
    if (lower.includes("warehouse")) return "warehouse";
    return raw || "office";
  }

  private mapFeatures(features: string[]): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};
    for (const f of features) {
      const key = f.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      mapped[key] = true;
    }
    return mapped;
  }
}
