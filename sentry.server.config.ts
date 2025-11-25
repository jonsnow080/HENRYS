import * as Sentry from "@sentry/nextjs";

const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? "0"),
  enableTracing: true,
});
