import * as Sentry from "@sentry/nextjs";

const tracesSampleRate = parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0");
const replaySampleRate = parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE ?? "0");
const replaysOnErrorSampleRate = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? "1.0",
);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  replaysSessionSampleRate: Number.isFinite(replaySampleRate) ? replaySampleRate : 0,
  replaysOnErrorSampleRate: Number.isFinite(replaysOnErrorSampleRate)
    ? replaysOnErrorSampleRate
    : 1.0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
});
