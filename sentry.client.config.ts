import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  replaysSessionSampleRate: Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? 0),
  replaysOnErrorSampleRate: Number(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 1.0),
  enabled: Boolean(process.env.SENTRY_DSN),
});
