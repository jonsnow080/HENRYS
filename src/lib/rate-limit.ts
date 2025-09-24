const store = new Map<string, { count: number; expiresAt: number }>();

const MAX = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 5);
const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 900) * 1000;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + WINDOW });
    return { allowed: true, remaining: MAX - 1, resetAt: now + WINDOW };
  }

  if (entry.count >= MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.expiresAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: MAX - entry.count, resetAt: entry.expiresAt };
}
