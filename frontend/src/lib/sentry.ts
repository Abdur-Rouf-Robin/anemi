export async function initBrowserSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;
  const Sentry = await import("@sentry/browser");
  Sentry.init({ dsn, tracesSampleRate: 0.1 });
}
