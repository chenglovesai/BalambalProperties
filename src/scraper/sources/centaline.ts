import type { Page } from "playwright";
import { SCRAPER_CONFIG } from "../config";
import type { RawListing, ScrapeOptions } from "../types";
import { BaseScraper } from "./base";

const config = SCRAPER_CONFIG.sources.centaline;

interface CentalineCard {
  id: string;
  url: string;
  buildingName: string;
  floorLevel: string;
  district: string;
  address: string;
  mtrProximity: string;
  usageType: string;
  area: string;
  saleInfo: string;
  leaseInfo: string;
  agentName: string;
  agentLicense: string;
  agentPhone: string;
  features: string[];
  propertyNo: string;
}

export class CentalineScraper extends BaseScraper {
  readonly sourceName = config.name;
  readonly baseUrl = config.baseUrl;

  protected async scrape(options: ScrapeOptions): Promise<{ listings: RawListing[]; pagesScraped: number }> {
    const allListings: RawListing[] = [];
    let totalPages = 0;

    for (const category of config.categories) {
      const url = `${this.baseUrl}${category.path}`;
      this.log.info(`Scraping ${category.type}: ${url}`);

      const { listings, pages } = await this.scrapeCategory(url, category.type, options);
      allListings.push(...listings);
      totalPages += pages;

      await this.delay(options.delayBetweenRequests);
    }

    return { listings: allListings, pagesScraped: totalPages };
  }

  private async scrapeCategory(
    categoryUrl: string,
    propertyType: string,
    options: ScrapeOptions,
  ): Promise<{ listings: RawListing[]; pages: number }> {
    const page = await this.newPage();
    const listings: RawListing[] = [];
    let pagesScraped = 0;

    try {
      const ok = await this.navigateWithRetry(page, categoryUrl);
      if (!ok) return { listings, pages: 0 };

      await page.waitForTimeout(3000);

      const totalStr = await page.evaluate(() => {
        const el = document.querySelector('[class*="total"], [class*="count"]');
        return el?.textContent || "";
      });
      const totalMatch = totalStr.match(/([\d,]+)\s*Properties/i);
      const totalProperties = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ""), 10) : 0;
      if (totalProperties > 0) {
        this.log.info(`Found ${totalProperties} ${propertyType} properties`);
      }

      let hasMore = true;
      while (hasMore && pagesScraped < options.maxPagesPerCategory) {
        const cards = await this.extractListingCards(page);
        if (cards.length === 0) {
          this.log.debug(`No listings on page ${pagesScraped + 1}, stopping.`);
          break;
        }

        for (const card of cards) {
          const listing = this.mapToRawListing(card, propertyType);
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

  private async extractListingCards(page: Page): Promise<CentalineCard[]> {
    return page.evaluate(() => {
      const cards: CentalineCard[] = [];

      const listingLinks = Array.from(document.querySelectorAll('a[href*="/detail/"]'));
      const seen = new Set<string>();

      for (const link of listingLinks) {
        const href = (link as HTMLAnchorElement).href;
        const uuidMatch = href.match(/detail\/([a-f0-9-]+)/);
        if (!uuidMatch || seen.has(uuidMatch[1])) continue;
        seen.add(uuidMatch[1]);

        const container = link.closest('[class*="listing"], [class*="card"], [class*="item"]') || link;
        const text = container.textContent || "";

        const buildingMatch = text.match(/^([A-Za-z\s]+(?:Centre|Building|Tower|House|Plaza|Place|Court))/m);

        const floorMatch = text.match(/(Low|Middle|High|Ground)\s*Floor/i);

        const districtMatch = text.match(/(Central|Wan Chai|Causeway Bay|Sheung Wan|North Point|Quarry Bay|Chai Wan|Aberdeen|Sai Ying Pun|Tsim Sha Tsui|Jordan|Yau Ma Tei|Mong(?:\s)?kok|Mongkok|Prince Edward|Hung Hom|San Po Kong|Kowloon Bay|Kwun Tong|Tai Kok Tsui|Cheung Sha Wan|Sham Shui Po|Kwai Chung|Tsuen Wan|Tuen Mun|Sha Tin|Fo Tan|Tai Po|Yuen Long)/i);

        const addressMatch = text.match(/\d+[-\d]*\s+[A-Za-z\s]+(?:Road|Street|Avenue|Lane|Terrace|Drive|Path)/i);

        const mtrMatch = text.match(/(\d+)\s*min\(s\)\s*-\s*([A-Za-z\s]+Station)/i);

        const usageMatch = text.match(/(Office|Retail|Industrial)/i);

        const areaMatch = text.match(/([\d,]+)\s*ft²\s*approx/);

        const saleMatch = text.match(/Sale\s+\$([\d,.]+[MBK]?)\s*(?:@([\d,.]+))?/i);
        const leaseMatch = text.match(/Lease\s+\$([\d,.]+[MBK]?)\s*(?:@([\d,.]+))?/i);

        const propNoMatch = text.match(/Property No\.?:\s*(\w+)/);

        const featureKeywords = [
          "Fitted", "Sea View", "City View", "Mountain View", "Garden View",
          "Sole Agent", "Hot Listing", "Warehouse", "Catering", "COCKLOFT",
          "With Lease", "Ground Floor", "Whole Block", "VR Tour",
          "Split-Type A/C", "Water supply",
        ];
        const features = featureKeywords.filter((kw) => text.includes(kw));

        cards.push({
          id: uuidMatch[1],
          url: href,
          buildingName: buildingMatch?.[1]?.trim() || "",
          floorLevel: floorMatch?.[1] || "",
          district: districtMatch?.[1] || "",
          address: addressMatch?.[0]?.trim() || "",
          mtrProximity: mtrMatch ? `${mtrMatch[1]} min - ${mtrMatch[2]}` : "",
          usageType: usageMatch?.[1] || "",
          area: areaMatch?.[1] || "",
          saleInfo: saleMatch ? `$${saleMatch[1]}${saleMatch[2] ? ` @${saleMatch[2]}` : ""}` : "",
          leaseInfo: leaseMatch ? `$${leaseMatch[1]}${leaseMatch[2] ? ` @${leaseMatch[2]}` : ""}` : "",
          agentName: "",
          agentLicense: "",
          agentPhone: "",
          features,
          propertyNo: propNoMatch?.[1] || "",
        });
      }

      const agentElements = Array.from(document.querySelectorAll('[class*="agent"], [class*="salesman"]'));
      let agentIdx = 0;
      for (const el of agentElements) {
        const agentText = el.textContent || "";
        const nameMatch = agentText.match(/^([A-Za-z\s]+)/);
        const licenseMatch = agentText.match(/([ES]-\d+)/);
        const phoneEl = el.querySelector('a[href^="tel:"]');

        if (agentIdx < cards.length && nameMatch) {
          cards[agentIdx].agentName = nameMatch[1].trim();
          cards[agentIdx].agentLicense = licenseMatch?.[1] || "";
          cards[agentIdx].agentPhone = phoneEl?.textContent?.trim() || "";
        }
        agentIdx++;
      }

      return cards;
    });
  }

  private mapToRawListing(card: CentalineCard, categoryType: string): RawListing | null {
    if (!card.id) return null;

    const area = this.parseNumber(card.area);

    let monthlyRent: number | undefined;
    let salePrice: number | undefined;
    let psfRent: number | undefined;
    let psfPriceVal: number | undefined;
    let transactionType: "rent" | "sale" | "both" = "sale";

    if (card.leaseInfo) {
      const leaseMatch = card.leaseInfo.match(/\$([\d,.]+[MBK]?)\s*(?:@([\d,.]+))?/i);
      if (leaseMatch) {
        monthlyRent = this.parsePrice(leaseMatch[1]);
        psfRent = this.parseNumber(leaseMatch[2]);
      }
      transactionType = card.saleInfo ? "both" : "rent";
    }

    if (card.saleInfo) {
      const saleMatch = card.saleInfo.match(/\$([\d,.]+[MBK]?)\s*(?:@([\d,.]+))?/i);
      if (saleMatch) {
        salePrice = this.parsePrice(saleMatch[1]);
        psfPriceVal = this.parseNumber(saleMatch[2]);
      }
      if (!card.leaseInfo) transactionType = "sale";
    }

    const propertyType = this.mapUsageType(card.usageType || categoryType);

    const title = [card.buildingName, card.floorLevel ? `${card.floorLevel} Floor` : "", card.district]
      .filter(Boolean)
      .join(" - ") || `Property ${card.propertyNo}`;

    const address = card.address || (card.buildingName ? `${card.buildingName}, ${card.district}` : card.district);

    return {
      sourceId: `centaline-${card.id}`,
      source: this.sourceName,
      sourceUrl: card.url,
      title,
      district: card.district,
      address,
      buildingName: card.buildingName || undefined,
      propertyType,
      transactionType,
      grossAreaSqft: area,
      monthlyRent,
      psfRent,
      salePrice,
      psfPrice: psfPriceVal,
      floor: card.floorLevel ? `${card.floorLevel} Floor` : undefined,
      images: [],
      agentName: card.agentName || undefined,
      agentContact: card.agentPhone || undefined,
      agentLicense: card.agentLicense || undefined,
      features: this.mapFeatures(card.features, card.mtrProximity),
      rawData: card as unknown as Record<string, unknown>,
      scrapedAt: new Date(),
    };
  }

  private async goToNextPage(page: Page): Promise<boolean> {
    try {
      const hasNext = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('a, button'));
        const nextBtn = buttons.find((el) => {
          const text = el.textContent?.trim() || "";
          const cls = el.className || "";
          return (
            text === ">" || text === "›" || text === "Next" ||
            cls.includes("next") || el.getAttribute("aria-label")?.includes("Next")
          );
        });
        if (nextBtn) {
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

  private mapUsageType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("office")) return "office";
    if (lower.includes("retail") || lower.includes("shop")) return "retail";
    if (lower.includes("industrial")) return "industrial";
    return raw || "office";
  }

  private mapFeatures(features: string[], mtrProximity: string): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};
    for (const f of features) {
      const key = f.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      mapped[key] = true;
    }
    if (mtrProximity) {
      mapped.mtrProximity = mtrProximity;
      mapped.mtrNearby = true;
    }
    return mapped;
  }
}
