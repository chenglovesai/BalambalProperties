import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { SCRAPER_CONFIG } from "../config";
import { createLogger } from "../logger";
import type { RawListing, ScraperError, ScraperResult, ScrapeOptions } from "../types";

process.env.PLAYWRIGHT_BROWSERS_PATH = "0";

export abstract class BaseScraper {
  abstract readonly sourceName: string;
  abstract readonly baseUrl: string;

  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected errors: ScraperError[] = [];
  protected log = createLogger("base");

  async init(): Promise<void> {
    this.log = createLogger(this.sourceName);
    this.log.info("Launching browser...");
    this.browser = await chromium.launch({
      headless: SCRAPER_CONFIG.browser.headless,
    });
    this.context = await this.browser.newContext({
      userAgent: SCRAPER_CONFIG.browser.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: "en-HK",
    });
    this.errors = [];
  }

  async close(): Promise<void> {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.browser = null;
    this.context = null;
  }

  async run(options: ScrapeOptions): Promise<ScraperResult> {
    const startTime = Date.now();
    let listings: RawListing[] = [];
    let pagesScraped = 0;

    try {
      await this.init();
      const result = await this.scrape(options);
      listings = result.listings;
      pagesScraped = result.pagesScraped;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`Fatal scraper error: ${message}`);
      this.errors.push({ url: this.baseUrl, message, timestamp: new Date() });
    } finally {
      await this.close();
    }

    const duration = Date.now() - startTime;
    this.log.info(`Finished: ${listings.length} listings from ${pagesScraped} pages in ${(duration / 1000).toFixed(1)}s (${this.errors.length} errors)`);

    return {
      source: this.sourceName,
      listings,
      errors: this.errors,
      pagesScraped,
      duration,
    };
  }

  protected abstract scrape(options: ScrapeOptions): Promise<{ listings: RawListing[]; pagesScraped: number }>;

  protected async newPage(): Promise<Page> {
    if (!this.context) throw new Error("Browser not initialized");
    return this.context.newPage();
  }

  protected async navigateWithRetry(page: Page, url: string, retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: SCRAPER_CONFIG.browser.timeout,
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (attempt === retries) {
          this.log.error(`Failed to navigate to ${url} after ${retries} attempts: ${message}`);
          this.errors.push({ url, message, timestamp: new Date() });
          return false;
        }
        this.log.warn(`Navigate attempt ${attempt}/${retries} failed for ${url}, retrying...`);
        await this.delay(2000 * attempt);
      }
    }
    return false;
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected parseNumber(text: string | undefined | null): number | undefined {
    if (!text) return undefined;
    const cleaned = text.replace(/[^0-9.,]/g, "").replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  protected parsePrice(text: string | undefined | null): number | undefined {
    if (!text) return undefined;
    const cleaned = text.replace(/[^0-9.,MBK]/gi, "").replace(/,/g, "");
    let num = parseFloat(cleaned);
    if (isNaN(num)) return undefined;
    if (/B/i.test(text)) num *= 1_000_000_000;
    else if (/M/i.test(text)) num *= 1_000_000;
    else if (/K/i.test(text)) num *= 1_000;
    return num;
  }

  protected recordError(url: string, message: string): void {
    this.errors.push({ url, message, timestamp: new Date() });
    this.log.error(`${url}: ${message}`);
  }

  protected normalizeImageUrls(urls: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const rawUrl of urls) {
      const url = this.normalizeImageUrl(rawUrl);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      normalized.push(url);
    }

    return normalized;
  }

  protected normalizeImageUrl(rawUrl: string | undefined | null): string | null {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http")) return null;

    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();

      // Drop common resizing/cropping query params to prefer original images.
      const removableParams = [
        "w",
        "h",
        "width",
        "height",
        "q",
        "quality",
        "fit",
        "crop",
        "auto",
        "dpr",
        "fm",
        "format",
      ];
      for (const key of removableParams) {
        parsed.searchParams.delete(key);
      }

      const sizeValue = parsed.searchParams.get("size");
      if (sizeValue && /thumb|small|medium/i.test(sizeValue)) {
        parsed.searchParams.delete("size");
      }

      // Unsplash seeded images often carry width constraints in query params.
      if (host.includes("images.unsplash.com")) {
        parsed.searchParams.delete("w");
      }

      return parsed.toString();
    } catch {
      return trimmed;
    }
  }
}
