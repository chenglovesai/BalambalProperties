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

  /**
   * Normalizes an image URL by upgrading it to the highest available quality
   * instead of stripping params (which can break CDN URLs).
   */
  protected normalizeImageUrl(rawUrl: string | undefined | null): string | null {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http")) return null;

    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();

      if (host.includes("images.unsplash.com")) {
        parsed.searchParams.set("w", "1200");
        parsed.searchParams.set("q", "80");
        parsed.searchParams.delete("fit");
        parsed.searchParams.delete("crop");
        return parsed.toString();
      }

      // 28hse: images from i1/i2.28hse.com – upgrade path-based sizes
      if (host.includes("28hse.com")) {
        parsed.pathname = parsed.pathname
          .replace(/\/s\d+x\d+\//gi, "/")
          .replace(/\/thumb(?:nail)?s?\//gi, "/")
          .replace(/\/small\//gi, "/")
          .replace(/\/medium\//gi, "/");
        return parsed.toString();
      }

      // For known HK property CDNs: maximize quality params rather than removing them
      if (
        host.includes("centanet.com") ||
        host.includes("midlandici.com.hk") ||
        host.includes("spacious.hk") ||
        host.includes("gohome.com.hk")
      ) {
        this.upgradeQualityParams(parsed);
        parsed.pathname = parsed.pathname
          .replace(/\/thumb(?:nail)?s?\//gi, "/")
          .replace(/\/small\//gi, "/")
          .replace(/\/medium\//gi, "/");
        return parsed.toString();
      }

      // For all other domains: keep URL intact, only upgrade size/quality params
      // if they already exist (never strip them – CDNs may require them).
      this.upgradeQualityParams(parsed);

      // Upgrade thumbnail path markers
      parsed.pathname = parsed.pathname
        .replace(/\/thumb(?:nail)?s?\//gi, "/")
        .replace(/\/small\//gi, "/");

      const sizeValue = parsed.searchParams.get("size");
      if (sizeValue && /thumb|small|medium/i.test(sizeValue)) {
        parsed.searchParams.set("size", "large");
      }

      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  /** Upgrade existing width/height/quality params to high values without removing them */
  private upgradeQualityParams(parsed: URL): void {
    for (const key of ["w", "width"]) {
      if (parsed.searchParams.has(key)) {
        const cur = parseInt(parsed.searchParams.get(key) || "0");
        if (cur < 1200) parsed.searchParams.set(key, "1200");
      }
    }
    for (const key of ["h", "height"]) {
      if (parsed.searchParams.has(key)) {
        const cur = parseInt(parsed.searchParams.get(key) || "0");
        if (cur < 900) parsed.searchParams.set(key, "900");
      }
    }
    for (const key of ["q", "quality"]) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, "90");
      }
    }
  }

  /**
   * Comprehensive image extraction from any page.
   * Uses raw string to avoid bundler __name injection in page.evaluate.
   */
  protected async extractAllPageImages(page: Page): Promise<string[]> {
    const EXTRACT_SCRIPT = `
      (function() {
        var images = [];
        var seen = new Set();
        function addImage(src) {
          if (!src) return;
          var s = String(src).trim();
          if (!s.startsWith("http")) return;
          if (seen.has(s)) return;
          if (/avatar|logo|icon|placeholder|no-photo|loadingphoto|spacer|blank|tracking|pixel|badge|agent[_-]?photo|btn|button/i.test(s)) return;
          if (/\\.gif$/i.test(s) && !s.includes("property") && !s.includes("photo")) return;
          seen.add(s);
          images.push(s);
        }
        function bestFromSrcset(srcset) {
          if (!srcset) return null;
          var bestUrl = "";
          var bestScore = -1;
          var parts = srcset.split(",");
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i].trim().split(/\\s+/);
            var url = p[0];
            var desc = p[1];
            if (!url) continue;
            var score = 0;
            if (desc && desc.endsWith("w")) score = parseInt(desc, 10) || 0;
            else if (desc && desc.endsWith("x")) score = Math.round((parseFloat(desc) || 0) * 1000);
            if (score >= bestScore) { bestScore = score; bestUrl = url; }
          }
          return bestUrl || null;
        }
        var imgs = document.querySelectorAll("img");
        for (var i = 0; i < imgs.length; i++) {
          var el = imgs[i];
          var u = bestFromSrcset(el.getAttribute("srcset") || el.getAttribute("data-srcset"));
          if (u) addImage(u);
          addImage(el.getAttribute("data-src"));
          addImage(el.getAttribute("data-original"));
          addImage(el.getAttribute("data-lazy-src"));
          addImage(el.getAttribute("data-zoom-src"));
          addImage(el.getAttribute("data-large-src"));
          addImage(el.getAttribute("data-full-src"));
          addImage(el.getAttribute("data-highres"));
          addImage(el.getAttribute("data-url"));
          addImage(el.getAttribute("data-src-url"));
          if (el.src && el.src.startsWith("http")) addImage(el.src);
        }
        var sources = document.querySelectorAll("picture source");
        for (var i = 0; i < sources.length; i++) {
          var u = bestFromSrcset(sources[i].getAttribute("srcset"));
          if (u) addImage(u);
        }
        var gallerySelectors = ["[class*=\\"gallery\\"]", "[class*=\\"carousel\\"]", "[class*=\\"slider\\"]", "[class*=\\"photo\\"]", "[class*=\\"swipe\\"]", "[class*=\\"lightbox\\"]", "[class*=\\"fancybox\\"]", "[data-gallery]", "[class*=\\"slide\\"]", "[class*=\\"thumbnail\\"]", "[class*=\\"thumb\\"]"];
        for (var s = 0; s < gallerySelectors.length; s++) {
          var els = document.querySelectorAll(gallerySelectors[s]);
          for (var i = 0; i < els.length; i++) {
            var bg = getComputedStyle(els[i]).backgroundImage;
            if (bg && bg !== "none") {
              var match = bg.match(/url\\(["']?(https?:\\/\\/[^"')]+)["']?\\)/);
              if (match) addImage(match[1]);
            }
            var style = els[i].getAttribute("style") || "";
            var sm = style.match(/url\\(["']?(https?:\\/\\/[^"')]+)["']?\\)/);
            if (sm) addImage(sm[1]);
          }
        }
        var dataEls = document.querySelectorAll("[data-image], [data-photo], [data-img], [data-bg], [data-src], [data-url]");
        for (var i = 0; i < dataEls.length; i++) {
          var e = dataEls[i];
          addImage(e.getAttribute("data-image"));
          addImage(e.getAttribute("data-photo"));
          addImage(e.getAttribute("data-img"));
          addImage(e.getAttribute("data-bg"));
          addImage(e.getAttribute("data-src"));
          addImage(e.getAttribute("data-url"));
        }
        var links = document.querySelectorAll('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".webp"], a[href*=".jpg?"], a[href*=".jpeg?"], a[href*=".png?"]');
        for (var i = 0; i < links.length; i++) addImage(links[i].href);
        var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (var i = 0; i < ldScripts.length; i++) {
          try {
            var json = JSON.parse(ldScripts[i].textContent || "{}");
            var items = Array.isArray(json) ? json : (json["@graph"] ? json["@graph"] : [json]);
            for (var j = 0; j < items.length; j++) {
              var imgs = items[j].image || items[j].photo || items[j].images || items[j].photos;
              if (Array.isArray(imgs)) {
                for (var k = 0; k < imgs.length; k++) {
                  var url = typeof imgs[k] === "string" ? imgs[k] : (imgs[k] && (imgs[k].url || imgs[k].contentUrl));
                  if (url) addImage(url);
                }
              } else if (typeof imgs === "string") addImage(imgs);
            }
          } catch (e) {}
        }
        var scripts = document.querySelectorAll("script:not([type])");
        for (var i = 0; i < scripts.length; i++) {
          var text = scripts[i].textContent || "";
          var re = /"images"\\s*:\\s*\\[([^\\]]+)\\]|"photos"\\s*:\\s*\\[([^\\]]+)\\]/g;
          var m;
          while ((m = re.exec(text)) !== null) {
            var arr = (m[1] || m[2] || "").match(/https?:\\/\\/[^"'\\s)]+/g);
            if (arr) for (var j = 0; j < arr.length; j++) addImage(arr[j]);
          }
        }
        return images;
      })()
    `;
    return page.evaluate(EXTRACT_SCRIPT);
  }

  /**
   * Visit a property detail page and extract all images from its gallery.
   * Scrolls the page, clicks through carousels, and intercepts network requests
   * to capture all property photos.
   */
  protected async scrapeDetailPageImages(detailUrl: string): Promise<string[]> {
    const page = await this.newPage();
    const imageUrls = new Set<string>();

    try {
      // Intercept network requests to capture image URLs as they load
      page.on("response", (response) => {
        const url = response.url();
        if (
          response.status() === 200 &&
          /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) &&
          !/avatar|logo|icon|placeholder|pixel|tracking|badge/i.test(url)
        ) {
          imageUrls.add(url);
        }
      });

      const ok = await this.navigateWithRetry(page, detailUrl, 2);
      if (!ok) return [];

      await page.waitForTimeout(3500);

      // Scroll to trigger lazy-loading (more scrolls, longer pauses)
      await page.evaluate(
        `(async function(){for(var i=0;i<8;i++){window.scrollBy(0,window.innerHeight);await new Promise(function(r){setTimeout(r,600)});}window.scrollTo(0,0);})()`,
      );

      await page.waitForTimeout(2000);

      // Click through carousel/gallery to expose all images (many sites show 1 at a time)
      const carouselSelectors = [
        'button[aria-label*="next" i], button[aria-label*="Next"]',
        '[class*="carousel"] button[class*="next"], [class*="gallery"] button[class*="next"]',
        '[class*="slider"] button[class*="next"], [class*="arrow"][class*="right"]',
        '[class*="slick-next"], .swiper-button-next, [class*="gallery"] button',
        '[data-testid*="next"], [data-action="next"]',
        'a[aria-label*="next" i], a[aria-label*="Next"]',
      ];

      for (let click = 0; click < 25; click++) {
        let clicked = false;
        for (const sel of carouselSelectors) {
          try {
            const btn = await page.$(sel);
            if (btn) {
              await btn.click();
              clicked = true;
              await page.waitForTimeout(800);
              break;
            }
          } catch {
            // selector not found or not clickable
          }
        }
        if (!clicked) break;
      }

      await page.waitForTimeout(1500);

      // Extract from DOM (thumbnails, data attrs, etc.)
      const domImages = await this.extractAllPageImages(page);
      for (const url of domImages) imageUrls.add(url);

      return this.normalizeImageUrls(Array.from(imageUrls));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.warn(`Detail image scrape failed for ${detailUrl}: ${msg}`);
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * Enrich a batch of listings by visiting each listing's detail page
   * to scrape the full image gallery. Rate-limited with configurable cap.
   */
  protected async enrichListingsWithDetailImages(
    listings: RawListing[],
    options: ScrapeOptions,
  ): Promise<void> {
    const cap = options.maxDetailPages ?? 100;
    const toEnrich = cap <= 0 ? listings : listings.slice(0, cap);
    this.log.info(`Enriching ${toEnrich.length}/${listings.length} listings with detail page images (cap=${cap})...`);
    let enriched = 0;

    for (const listing of toEnrich) {
      if (!listing.sourceUrl) continue;

      try {
        const detailImages = await this.scrapeDetailPageImages(listing.sourceUrl);
        if (detailImages.length > 0) {
          // Merge: detail page images first (higher quality), then any card images not already present
          const merged = new Set(detailImages);
          for (const img of listing.images) {
            merged.add(img);
          }
          listing.images = Array.from(merged);
          enriched++;
          this.log.debug(`  ${listing.sourceId}: ${detailImages.length} images from detail page (${listing.images.length} total)`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.log.warn(`  ${listing.sourceId}: detail scrape error: ${msg}`);
      }

      await this.delay(options.delayBetweenRequests);
    }

    this.log.info(`Detail enrichment complete: ${enriched}/${toEnrich.length} listings got more images`);
  }
}
