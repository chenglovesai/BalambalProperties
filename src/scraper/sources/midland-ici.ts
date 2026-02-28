import type { Page } from "playwright";
import { SCRAPER_CONFIG } from "../config";
import type { RawListing, ScrapeOptions } from "../types";
import { BaseScraper } from "./base";

const config = SCRAPER_CONFIG.sources.midlandIci;

interface MidlandCard {
  id: string;
  url: string;
  title: string;
  district: string;
  address: string;
  buildingName: string;
  floor: string;
  area: string;
  price: string;
  pricePerSqft: string;
  agentName: string;
  agentPhone: string;
  propertyType: string;
  transactionType: string;
  features: string[];
  images: string[];
}

export class MidlandIciScraper extends BaseScraper {
  readonly sourceName = config.name;
  readonly baseUrl = config.baseUrl;

  protected async scrape(options: ScrapeOptions): Promise<{ listings: RawListing[]; pagesScraped: number }> {
    const allListings: RawListing[] = [];
    let totalPages = 0;

    for (const category of config.categories) {
      const url = `${this.baseUrl}${category.path}`;
      this.log.info(`Scraping ${category.transactionType} ${category.type}: ${url}`);

      const { listings, pages } = await this.scrapeCategory(
        url,
        category.type,
        category.transactionType as "rent" | "sale",
        options,
      );
      allListings.push(...listings);
      totalPages += pages;

      await this.delay(options.delayBetweenRequests);
    }

    return { listings: allListings, pagesScraped: totalPages };
  }

  private async scrapeCategory(
    categoryUrl: string,
    propertyType: string,
    transactionType: "rent" | "sale",
    options: ScrapeOptions,
  ): Promise<{ listings: RawListing[]; pages: number }> {
    const page = await this.newPage();
    const listings: RawListing[] = [];
    let pagesScraped = 0;

    try {
      const ok = await this.navigateWithRetry(page, categoryUrl);
      if (!ok) return { listings, pages: 0 };

      await page.waitForTimeout(3000);

      let hasMore = true;
      while (hasMore && pagesScraped < options.maxPagesPerCategory) {
        const cards = await this.extractListingCards(page, transactionType);
        if (cards.length === 0) {
          this.log.debug(`No listings on page ${pagesScraped + 1}, stopping.`);
          break;
        }

        for (const card of cards) {
          const listing = this.mapToRawListing(card, propertyType, transactionType);
          if (listing) listings.push(listing);
        }

        pagesScraped++;
        this.log.debug(`Page ${pagesScraped}: ${cards.length} listings (total: ${listings.length})`);

        hasMore = await this.goToNextPage(page);
        if (hasMore) {
          await this.delay(options.delayBetweenRequests);
          await page.waitForTimeout(2000);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.recordError(categoryUrl, msg);
    } finally {
      await page.close();
    }

    return { listings, pages: pagesScraped };
  }

  private async extractListingCards(page: Page, transactionType: string): Promise<MidlandCard[]> {
    return page.evaluate(
      ({ txType }) => {
        const cards: MidlandCard[] = [];
        const seen = new Set<string>();

        const propertyLinks = Array.from(document.querySelectorAll(
          'a[href*="/property/"], a[href*="/en/office/"], a[href*="/en/shop/"], a[href*="/en/industrial/"]',
        ));

        for (const link of propertyLinks) {
          const href = (link as HTMLAnchorElement).href;
          const idMatch = href.match(/\/([A-Z]\d+)$/) || href.match(/property\/([^/]+)/);
          if (!idMatch) continue;
          const id = idMatch[1];
          if (seen.has(id)) continue;
          seen.add(id);

          const container = link.closest(
            '[class*="listing"], [class*="card"], [class*="item"], [class*="property"], .search-results > div',
          ) || link.parentElement?.parentElement;
          if (!container) continue;

          const text = container.textContent || "";

          const titleEl = container.querySelector("h2, h3, h4, [class*='title'], [class*='name']");
          const title = titleEl?.textContent?.trim() || link.textContent?.trim() || "";

          const districtMatch = text.match(
            /(Central|Wan Chai|Causeway Bay|Sheung Wan|North Point|Quarry Bay|Tsim Sha Tsui|Jordan|Yau Ma Tei|Mong Kok|Kwun Tong|Kowloon Bay|Cheung Sha Wan|Sham Shui Po|Kwai Chung|Tsuen Wan|Tuen Mun|Sha Tin|Tai Po|Yuen Long)/i,
          );
          const district = districtMatch?.[1] || "";

          const addressEl = container.querySelector("[class*='address'], [class*='location']");
          const address = addressEl?.textContent?.trim() || "";

          const buildingEl = container.querySelector("[class*='building']");
          const buildingName = buildingEl?.textContent?.trim() || "";

          const floorMatch = text.match(/(Low|Middle|High|Ground)\s*Floor|\d+\/F|G\/F/i);
          const floor = floorMatch?.[0] || "";

          const areaMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*ft\.?|ft²|sqft)/i);
          const area = areaMatch?.[1] || "";

          const priceMatch = text.match(/\$\s*([\d,.]+[MBK]?)/i);
          const price = priceMatch?.[1] || "";

          const psfMatch = text.match(/@\s*\$?([\d,.]+)/);
          const psf = psfMatch?.[1] || "";

          const agentNameEl = container.querySelector("[class*='agent'] [class*='name'], [class*='salesman']");
          const agentName = agentNameEl?.textContent?.trim() || "";

          const phoneEl = container.querySelector('a[href^="tel:"]');
          const agentPhone = phoneEl?.textContent?.trim() || "";

          const imgElements = Array.from(container.querySelectorAll("img[src]"));
          const images: string[] = [];
          for (const img of imgElements) {
            const src = (img as HTMLImageElement).src;
            if (src && !src.includes("avatar") && !src.includes("logo") && !src.includes("icon")) {
              images.push(src);
            }
          }

          const featureKeywords = [
            "Sea View", "City View", "Mountain View", "Fitted", "Whole Floor",
            "Corner", "Vacant", "Carpark", "Grade A",
          ];
          const features = featureKeywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()));

          cards.push({
            id,
            url: href,
            title,
            district,
            address,
            buildingName,
            floor,
            area,
            price,
            pricePerSqft: psf,
            agentName,
            agentPhone,
            propertyType: "",
            transactionType: txType,
            features,
            images,
          });
        }

        return cards;
      },
      { txType: transactionType },
    );
  }

  private mapToRawListing(
    card: MidlandCard,
    categoryType: string,
    transactionType: "rent" | "sale",
  ): RawListing | null {
    if (!card.id) return null;

    const area = this.parseNumber(card.area);
    const price = this.parsePrice(card.price);
    const psf = this.parseNumber(card.pricePerSqft);

    let monthlyRent: number | undefined;
    let salePrice: number | undefined;
    let psfRent: number | undefined;
    let psfPriceVal: number | undefined;

    if (transactionType === "rent") {
      monthlyRent = price;
      psfRent = psf;
    } else {
      salePrice = price;
      psfPriceVal = psf;
    }

    const propertyType = this.mapPropertyType(categoryType);

    return {
      sourceId: `midland-${card.id}`,
      source: this.sourceName,
      sourceUrl: card.url.startsWith("http") ? card.url : `${this.baseUrl}${card.url}`,
      title: card.title || `${card.buildingName || categoryType} - ${card.district}`,
      district: card.district,
      address: card.address || `${card.buildingName}, ${card.district}`,
      buildingName: card.buildingName || undefined,
      propertyType,
      transactionType,
      grossAreaSqft: area,
      monthlyRent,
      psfRent,
      salePrice,
      psfPrice: psfPriceVal,
      floor: card.floor || undefined,
      images: card.images,
      agentName: card.agentName || undefined,
      agentContact: card.agentPhone || undefined,
      features: this.mapFeatures(card.features),
      rawData: card as unknown as Record<string, unknown>,
      scrapedAt: new Date(),
    };
  }

  private async goToNextPage(page: Page): Promise<boolean> {
    try {
      const hasNext = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("a, button"));
        const nextBtn = buttons.find((el) => {
          const text = el.textContent?.trim() || "";
          const cls = el.className || "";
          const ariaLabel = el.getAttribute("aria-label") || "";
          return (
            text === ">" || text === "›" || text === "Next" || text === "»" ||
            cls.includes("next") || ariaLabel.includes("Next") || ariaLabel.includes("next")
          );
        });
        if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
          (nextBtn as HTMLElement).click();
          return true;
        }
        return false;
      });
      return hasNext;
    } catch {
      return false;
    }
  }

  private mapPropertyType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("office")) return "office";
    if (lower.includes("shop") || lower.includes("retail")) return "retail";
    if (lower.includes("industrial")) return "industrial";
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
