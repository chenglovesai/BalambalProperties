import cron from "node-cron";
import { SCRAPER_CONFIG } from "./config";
import { createLogger } from "./logger";
import { runScraper, shutdown } from "./runner";

const log = createLogger("scheduler");

const args = process.argv.slice(2);
const isOnce = args.includes("--once");
const isFullScan = args.includes("--full");

async function main() {
  log.info("HK Commercial Property Scraper");
  log.info(`Mode: ${isOnce ? "single run" : "scheduled (hourly)"}`);
  log.info(`Scan type: ${isFullScan ? "FULL" : "incremental"}`);

  if (isOnce) {
    try {
      const stats = await runScraper(isFullScan);
      log.info("Single run complete.", stats);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Scrape failed: ${msg}`);
      process.exitCode = 1;
    } finally {
      await shutdown();
    }
    return;
  }

  log.info(`Scheduling hourly scrape (cron: ${SCRAPER_CONFIG.schedule.cron})`);

  log.info("Running initial scrape on startup...");
  try {
    await runScraper(isFullScan);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Initial scrape failed: ${msg}`);
  }

  let isRunning = false;

  cron.schedule(SCRAPER_CONFIG.schedule.cron, async () => {
    if (isRunning) {
      log.warn("Previous scrape still running, skipping this cycle.");
      return;
    }

    isRunning = true;
    log.info("Hourly scrape triggered.");

    try {
      await runScraper(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Scheduled scrape failed: ${msg}`);
    } finally {
      isRunning = false;
    }
  });

  log.info("Scheduler running. Press Ctrl+C to stop.");

  const gracefulShutdown = async () => {
    log.info("Shutting down...");
    await shutdown();
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

main().catch((err) => {
  log.error(`Fatal error: ${err.message || err}`);
  process.exit(1);
});
