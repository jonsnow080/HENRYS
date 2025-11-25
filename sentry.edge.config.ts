import * as Sentry from "@sentry/nextjs";

const tracesSampleRate = parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0");

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
});
