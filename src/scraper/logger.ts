type LogLevel = "info" | "warn" | "error" | "debug";

const COLORS = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function log(level: LogLevel, source: string, message: string, data?: unknown): void {
  const color = COLORS[level];
  const prefix = `${COLORS.bold}[${timestamp()}]${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset} ${COLORS.bold}[${source}]${COLORS.reset}`;
  console.log(`${prefix} ${message}`);
  if (data !== undefined) {
    console.log(`  ${JSON.stringify(data, null, 2)}`);
  }
}

export function createLogger(source: string) {
  return {
    info: (msg: string, data?: unknown) => log("info", source, msg, data),
    warn: (msg: string, data?: unknown) => log("warn", source, msg, data),
    error: (msg: string, data?: unknown) => log("error", source, msg, data),
    debug: (msg: string, data?: unknown) => log("debug", source, msg, data),
  };
}
