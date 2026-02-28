import { SCRAPER_CONFIG, DEFAULT_SCRAPE_OPTIONS, FULL_SCAN_OPTIONS } from "./config";
import { upsertProperties, markStaleListings, getScraperStats, disconnect } from "./db";
import { createLogger } from "./logger";
import { normalizeListing, deduplicateListings } from "./normalizer";
import { CentalineScraper } from "./sources/centaline";
import { GoHomeScraper } from "./sources/gohome";
import { MidlandIciScraper } from "./sources/midland-ici";
import { SpaciousScraper } from "./sources/spacious";
import { TwentyEightHseScraper } from "./sources/twenty-eight-hse";
import type { RawListing, ScraperResult, ScraperStats, ScrapeOptions } from "./types";

const log = createLogger("runner");

function createScrapers() {
  const scrapers = [];
  const sources = SCRAPER_CONFIG.sources;

  if (sources.twentyEightHse.enabled) scrapers.push(new TwentyEightHseScraper());
  if (sources.centaline.enabled) scrapers.push(new CentalineScraper());
  if (sources.spacious.enabled) scrapers.push(new SpaciousScraper());
  if (sources.midlandIci.enabled) scrapers.push(new MidlandIciScraper());
  scrapers.push(new GoHomeScraper());

  return scrapers;
}

export async function runScraper(fullScan = false): Promise<ScraperStats> {
  const startTime = Date.now();
  const options: ScrapeOptions = fullScan ? FULL_SCAN_OPTIONS : DEFAULT_SCRAPE_OPTIONS;

  log.info(`Starting ${fullScan ? "FULL" : "incremental"} scrape...`);
  log.info(`Options: maxPages=${options.maxPagesPerCategory}, delay=${options.delayBetweenRequests}ms`);

  const scrapers = createScrapers();
  const allResults: ScraperResult[] = [];
  const allListings: RawListing[] = [];
  const sourceStats: Record<string, { listings: number; errors: number }> = {};

  for (const scraper of scrapers) {
    log.info(`\n${"=".repeat(60)}`);
    log.info(`Running: ${scraper.sourceName}`);
    log.info(`${"=".repeat(60)}`);

    try {
      const result = await scraper.run(options);
      allResults.push(result);
      allListings.push(...result.listings);
      sourceStats[result.source] = {
        listings: result.listings.length,
        errors: result.errors.length,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Scraper ${scraper.sourceName} crashed: ${msg}`);
      sourceStats[scraper.sourceName] = { listings: 0, errors: 1 };
    }
  }

  log.info(`\n${"=".repeat(60)}`);
  log.info("PROCESSING RESULTS");
  log.info(`${"=".repeat(60)}`);
  log.info(`Total raw listings: ${allListings.length}`);

  const deduped = deduplicateListings(allListings);
  log.info(`After deduplication: ${deduped.length}`);

  const normalized = deduped.map(normalizeListing);
  log.info(`Normalized: ${normalized.length} properties`);

  const upsertResult = await upsertProperties(normalized);

  const staleCount = await markStaleListings(30);

  const duration = Date.now() - startTime;

  const stats: ScraperStats = {
    totalListings: allListings.length,
    newListings: upsertResult.created,
    updatedListings: upsertResult.updated,
    errors: upsertResult.errors + allResults.reduce((sum, r) => sum + r.errors.length, 0),
    duration,
    sources: sourceStats,
  };

  log.info(`\n${"=".repeat(60)}`);
  log.info("SCRAPE COMPLETE");
  log.info(`${"=".repeat(60)}`);
  log.info(`Duration: ${(duration / 1000).toFixed(1)}s`);
  log.info(`New: ${stats.newListings} | Updated: ${stats.updatedListings} | Errors: ${stats.errors}`);
  if (staleCount > 0) log.info(`Stale: ${staleCount} properties marked stale`);

  for (const [source, data] of Object.entries(sourceStats)) {
    log.info(`  ${source}: ${data.listings} listings, ${data.errors} errors`);
  }

  try {
    const dbStats = await getScraperStats();
    log.info(`\nDatabase totals:`);
    log.info(`  Total: ${dbStats.totalProperties} | Active: ${dbStats.activeProperties}`);
    log.info(`  By source:`, dbStats.bySource);
    log.info(`  By type:`, dbStats.byType);
  } catch {
    // stats query failed, not critical
  }

  return stats;
}

export async function shutdown(): Promise<void> {
  await disconnect();
}
