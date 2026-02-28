import type { Page } from "playwright";
import { SCRAPER_CONFIG } from "../config";
import type { RawListing, ScrapeOptions } from "../types";
import { BaseScraper } from "./base";

const config = SCRAPER_CONFIG.sources.spacious;

interface SpaciousCard {
  id: string;
  url: string;
  title: string;
  district: string;
  buildingName: string;
  address: string;
  area: string;
  price: string;
  pricePerSqft: string;
  propertyType: string;
  images: string[];
  features: string[];
  bedrooms: string;
}

export class SpaciousScraper extends BaseScraper {
  readonly sourceName = config.name;
  readonly baseUrl = config.baseUrl;

  protected async scrape(options: ScrapeOptions): Promise<{ listings: RawListing[]; pagesScraped: number }> {
    const allListings: RawListing[] = [];
    let totalPages = 0;

    for (const listing of config.listingPaths) {
      const url = `${this.baseUrl}${listing.path}`;
      this.log.info(`Scraping ${listing.type}: ${url}`);

      const { listings, pages } = await this.scrapeListingPage(url, listing.type, options);
      allListings.push(...listings);
      totalPages += pages;

      await this.delay(options.delayBetweenRequests);
    }

    return { listings: allListings, pagesScraped: totalPages };
  }

  private async scrapeListingPage(
    listingUrl: string,
    propertyType: string,
    options: ScrapeOptions,
  ): Promise<{ listings: RawListing[]; pages: number }> {
    const page = await this.newPage();
    const listings: RawListing[] = [];
    let pagesScraped = 0;

    try {
      let apiListings = await this.tryInterceptApi(page, listingUrl, options);

      if (apiListings.length > 0) {
        this.log.info(`Got ${apiListings.length} listings from API interception`);
        for (const data of apiListings) {
          const listing = this.mapApiDataToRawListing(data, propertyType);
          if (listing) listings.push(listing);
        }
        pagesScraped = 1;
      } else {
        const ok = await this.navigateWithRetry(page, listingUrl);
        if (!ok) return { listings, pages: 0 };

        await page.waitForTimeout(5000);

        let hasMore = true;
        while (hasMore && pagesScraped < options.maxPagesPerCategory) {
          await this.scrollToLoadMore(page);

          const cards = await this.extractListingCards(page);
          if (cards.length === 0 && pagesScraped === 0) {
            this.log.warn("No listings found via DOM extraction.");
            break;
          }

          const newCards = cards.filter(
            (c) => !listings.some((l) => l.sourceId === `spacious-${c.id}`),
          );

          if (newCards.length === 0) {
            this.log.debug("No new listings found, stopping.");
            break;
          }

          for (const card of newCards) {
            const listing = this.mapToRawListing(card, propertyType);
            if (listing) listings.push(listing);
          }

          pagesScraped++;
          this.log.debug(`Scroll ${pagesScraped}: ${newCards.length} new listings (total: ${listings.length})`);

          hasMore = await this.loadMoreResults(page);
          if (hasMore) {
            await this.delay(options.delayBetweenRequests);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.recordError(listingUrl, msg);
    } finally {
      await page.close();
    }

    return { listings, pages: pagesScraped };
  }

  private async tryInterceptApi(
    page: Page,
    listingUrl: string,
    options: ScrapeOptions,
  ): Promise<Record<string, unknown>[]> {
    const apiResponses: Record<string, unknown>[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      if (
        (url.includes("/api/") || url.includes("graphql") || url.includes("/search")) &&
        response.status() === 200 &&
        response.headers()["content-type"]?.includes("json")
      ) {
        try {
          const json = await response.json();
          if (Array.isArray(json)) {
            apiResponses.push(...json);
          } else if (json?.data?.listings) {
            apiResponses.push(...json.data.listings);
          } else if (json?.results) {
            apiResponses.push(...json.results);
          } else if (json?.listings) {
            apiResponses.push(...json.listings);
          }
        } catch {
          // not JSON
        }
      }
    });

    try {
      await page.goto(listingUrl, { waitUntil: "networkidle", timeout: options.delayBetweenRequests * 10 });
      await page.waitForTimeout(3000);
    } catch {
      // timeout is ok, we may have captured responses already
    }

    return apiResponses;
  }

  private async extractListingCards(page: Page): Promise<SpaciousCard[]> {
    return page.evaluate(() => {
      const cards: SpaciousCard[] = [];
      const seen = new Set<string>();

      const listings = Array.from(document.querySelectorAll(
        '[class*="listing-card"], [class*="PropertyCard"], [class*="property-item"], [data-testid*="listing"], a[href*="/hong-kong/"]',
      ));

      for (const el of listings) {
        const link = el.tagName === "A" ? el : el.querySelector("a[href]");
        if (!link) continue;

        const href = (link as HTMLAnchorElement).href;
        const idMatch = href.match(/\/(\d+)(?:[?#]|$)/);
        const id = idMatch?.[1] || href.replace(/[^a-z0-9]/gi, "").slice(-12);
        if (seen.has(id)) continue;
        seen.add(id);

        const text = el.textContent || "";

        const title = el.querySelector("h2, h3, [class*='title'], [class*='name']")?.textContent?.trim() || "";
        const district = el.querySelector("[class*='district'], [class*='location']")?.textContent?.trim() || "";

        const areaMatch = text.match(/([\d,]+)\s*(?:sq\s*ft|sqft|ft²)/i);
        const priceMatch = text.match(/HK\$\s*([\d,]+(?:\.\d+)?[MBK]?)/i) || text.match(/\$([\d,]+)/);
        const psfMatch = text.match(/@\s*\$([\d,.]+)/);

        const imgElements = Array.from(el.querySelectorAll("img[src]"));
        const images: string[] = [];
        for (const img of imgElements) {
          const src = (img as HTMLImageElement).src || (img as HTMLImageElement).dataset.src || "";
          if (src && !src.includes("avatar") && !src.includes("logo")) {
            images.push(src);
          }
        }

        cards.push({
          id,
          url: href,
          title,
          district,
          buildingName: "",
          address: district,
          area: areaMatch?.[1] || "",
          price: priceMatch?.[1] || "",
          pricePerSqft: psfMatch?.[1] || "",
          propertyType: "",
          images,
          features: [],
          bedrooms: "",
        });
      }

      return cards;
    });
  }

  private mapToRawListing(card: SpaciousCard, categoryType: string): RawListing | null {
    if (!card.id) return null;

    const area = this.parseNumber(card.area);
    const price = this.parsePrice(card.price);
    const psf = this.parseNumber(card.pricePerSqft);

    return {
      sourceId: `spacious-${card.id}`,
      source: this.sourceName,
      sourceUrl: card.url,
      title: card.title || `${card.buildingName || "Commercial"} - ${card.district}`,
      district: card.district,
      address: card.address,
      buildingName: card.buildingName || undefined,
      propertyType: categoryType === "commercial" ? "office" : categoryType,
      transactionType: "rent",
      saleableAreaSqft: area,
      monthlyRent: price,
      psfRent: psf,
      floor: undefined,
      images: card.images,
      features: {},
      rawData: card as unknown as Record<string, unknown>,
      scrapedAt: new Date(),
    };
  }

  private mapApiDataToRawListing(data: Record<string, unknown>, categoryType: string): RawListing | null {
    const id = String(data.id || data._id || data.listing_id || "");
    if (!id) return null;

    const title = String(data.title || data.name || data.address || "");
    const district = String(data.district || data.area || data.location || "");
    const address = String(data.address || data.full_address || "");
    const buildingName = String(data.building_name || data.building || data.estate || "");
    const area = typeof data.area_sqft === "number" ? data.area_sqft :
      typeof data.saleable_area === "number" ? data.saleable_area :
      typeof data.size === "number" ? data.size : undefined;
    const price = typeof data.price === "number" ? data.price :
      typeof data.rent === "number" ? data.rent :
      typeof data.monthly_rent === "number" ? data.monthly_rent : undefined;
    const images = Array.isArray(data.images) ? data.images.map(String) :
      Array.isArray(data.photos) ? data.photos.map(String) : [];

    return {
      sourceId: `spacious-${id}`,
      source: this.sourceName,
      sourceUrl: `${this.baseUrl}/en/hong-kong/${id}`,
      title: title || `${buildingName || "Commercial"} - ${district}`,
      district,
      address: address || `${buildingName}, ${district}`,
      buildingName: buildingName || undefined,
      propertyType: categoryType === "commercial" ? "office" : categoryType,
      transactionType: "rent",
      saleableAreaSqft: area as number | undefined,
      monthlyRent: price as number | undefined,
      images,
      features: (data.features || {}) as Record<string, unknown>,
      rawData: data,
      scrapedAt: new Date(),
    };
  }

  private async scrollToLoadMore(page: Page): Promise<void> {
    await page.evaluate(async () => {
      for (let i = 0; i < 3; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise((r) => setTimeout(r, 1000));
      }
    });
  }

  private async loadMoreResults(page: Page): Promise<boolean> {
    try {
      const loadMore = await page.$('button:has-text("Load More"), button:has-text("Show More"), [class*="loadMore"]');
      if (loadMore) {
        await loadMore.click();
        await page.waitForTimeout(2000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
