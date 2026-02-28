import type { Page } from "playwright";
import type { RawListing, ScrapeOptions } from "../types";
import { BaseScraper } from "./base";

interface GoHomeCard {
  id: string;
  url: string;
  title: string;
  district: string;
  address: string;
  buildingName: string;
  area: string;
  price: string;
  pricePerSqft: string;
  floor: string;
  agentName: string;
  features: string[];
  images: string[];
  transactionType: string;
}

export class GoHomeScraper extends BaseScraper {
  readonly sourceName = "gohome";
  readonly baseUrl = "https://www.gohome.com.hk";

  private readonly categories = [
    { type: "office", transactionType: "rent", path: "/en/rent/office/" },
    { type: "office", transactionType: "sale", path: "/en/sale/office/" },
    { type: "shop", transactionType: "rent", path: "/en/rent/shop/" },
    { type: "shop", transactionType: "sale", path: "/en/sale/shop/" },
    { type: "industrial", transactionType: "rent", path: "/en/rent/industrial/" },
    { type: "industrial", transactionType: "sale", path: "/en/sale/industrial/" },
  ];

  protected async scrape(options: ScrapeOptions): Promise<{ listings: RawListing[]; pagesScraped: number }> {
    const allListings: RawListing[] = [];
    let totalPages = 0;

    for (const category of this.categories) {
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

  private async extractListingCards(page: Page, transactionType: string): Promise<GoHomeCard[]> {
    return page.evaluate(
      ({ txType }) => {
        const cards: GoHomeCard[] = [];
        const seen = new Set<string>();

        const allLinks = Array.from(document.querySelectorAll(
          'a[href*="/property/"], a[href*="/listing/"], a[href*="detail"]',
        ));

        for (const link of allLinks) {
          const href = (link as HTMLAnchorElement).href;
          const idMatch = href.match(/(?:property|listing)\/(\d+)/) || href.match(/\/(\d{6,})/);
          if (!idMatch) continue;
          const id = idMatch[1];
          if (seen.has(id)) continue;
          seen.add(id);

          const container = link.closest(
            '[class*="listing"], [class*="card"], [class*="item"], [class*="property"]',
          ) || link.parentElement?.parentElement;
          if (!container) continue;

          const text = container.textContent || "";

          const titleEl = container.querySelector("h2, h3, h4, [class*='title']");
          const title = titleEl?.textContent?.trim() || link.textContent?.trim() || "";

          const districtMatch = text.match(
            /(Central|Wan Chai|Causeway Bay|Sheung Wan|North Point|Quarry Bay|Tsim Sha Tsui|Jordan|Yau Ma Tei|Mong Kok|Kwun Tong|Kowloon Bay|Cheung Sha Wan|Kwai Chung|Tsuen Wan|Sha Tin)/i,
          );
          const district = districtMatch?.[1] || "";

          const areaMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*ft\.?|ft²|sqft)/i);
          const priceMatch = text.match(/\$\s*([\d,.]+[MBK]?)/i);
          const psfMatch = text.match(/@\s*\$?([\d,.]+)/);
          const floorMatch = text.match(/(Low|Middle|High|Ground)\s*Floor|\d+\/F/i);

          const buildingEl = container.querySelector("[class*='building'], [class*='estate']");
          const buildingName = buildingEl?.textContent?.trim() || "";

          const addressEl = container.querySelector("[class*='address']");
          const address = addressEl?.textContent?.trim() || "";

          const imgElements = Array.from(container.querySelectorAll("img"));
          const images: string[] = [];
          for (const img of imgElements) {
            const el = img as HTMLImageElement;
            let srcsetBest: string | null = null;
            const srcset = el.getAttribute("srcset") || el.getAttribute("data-srcset");
            if (srcset) {
              let bestScore = -1;
              for (const part of srcset.split(",")) {
                const [urlPart, descriptor] = part.trim().split(/\s+/);
                if (!urlPart) continue;
                let score = 0;
                if (descriptor?.endsWith("w")) {
                  const parsed = parseInt(descriptor, 10);
                  score = Number.isFinite(parsed) ? parsed : 0;
                } else if (descriptor?.endsWith("x")) {
                  const parsed = parseFloat(descriptor);
                  score = Number.isFinite(parsed) ? Math.round(parsed * 1000) : 0;
                }
                if (score >= bestScore) {
                  bestScore = score;
                  srcsetBest = urlPart;
                }
              }
            }
            const src = el.getAttribute("data-src")
              || el.getAttribute("data-original")
              || el.getAttribute("data-lazy-src")
              || srcsetBest
              || el.src;
            if (src && src.startsWith("http") && !src.includes("avatar") && !src.includes("logo") && !src.includes("icon") && !src.includes("placeholder") && !src.includes("no-photo")) {
              images.push(src);
            }
          }

          cards.push({
            id,
            url: href,
            title,
            district,
            address,
            buildingName,
            area: areaMatch?.[1] || "",
            price: priceMatch?.[1] || "",
            pricePerSqft: psfMatch?.[1] || "",
            floor: floorMatch?.[0] || "",
            agentName: "",
            features: [],
            images,
            transactionType: txType,
          });
        }

        return cards;
      },
      { txType: transactionType },
    );
  }

  private mapToRawListing(
    card: GoHomeCard,
    categoryType: string,
    transactionType: "rent" | "sale",
  ): RawListing | null {
    if (!card.id) return null;

    const area = this.parseNumber(card.area);
    const price = this.parsePrice(card.price);
    const psf = this.parseNumber(card.pricePerSqft);

    return {
      sourceId: `gohome-${card.id}`,
      source: this.sourceName,
      sourceUrl: card.url.startsWith("http") ? card.url : `${this.baseUrl}${card.url}`,
      title: card.title || `${card.buildingName || categoryType} - ${card.district}`,
      district: card.district,
      address: card.address || `${card.buildingName}, ${card.district}`,
      buildingName: card.buildingName || undefined,
      propertyType: this.mapPropertyType(categoryType),
      transactionType,
      grossAreaSqft: area,
      monthlyRent: transactionType === "rent" ? price : undefined,
      psfRent: transactionType === "rent" ? psf : undefined,
      salePrice: transactionType === "sale" ? price : undefined,
      psfPrice: transactionType === "sale" ? psf : undefined,
      floor: card.floor || undefined,
      images: this.normalizeImageUrls(card.images),
      agentName: card.agentName || undefined,
      features: {},
      rawData: card as unknown as Record<string, unknown>,
      scrapedAt: new Date(),
    };
  }

  private async goToNextPage(page: Page): Promise<boolean> {
    try {
      return page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("a, button"));
        const nextBtn = buttons.find((el) => {
          const text = el.textContent?.trim() || "";
          const cls = el.className || "";
          return text === "Next" || text === ">" || text === "›" || cls.includes("next");
        });
        if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
          (nextBtn as HTMLElement).click();
          return true;
        }
        return false;
      });
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
}
