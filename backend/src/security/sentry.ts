import { Logger } from "@nestjs/common";

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  const Sentry = await import("@sentry/node");
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.1
  });
  new Logger("Sentry").log("Sentry enabled");
}
