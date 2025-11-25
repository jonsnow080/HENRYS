import { Ratelimit, type RatelimitResponse } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers as nextHeaders } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const redis = Redis.fromEnv();

const authLimiter = new Ratelimit({
  redis,
  analytics: true,
  prefix: "rate:auth",
  limiter: Ratelimit.slidingWindow(10, "5 m"),
});

const applicationLimiter = new Ratelimit({
  redis,
  analytics: true,
  prefix: "rate:application",
  limiter: Ratelimit.fixedWindow(3, "30 m"),
});

const checkoutLimiter = new Ratelimit({
  redis,
  analytics: true,
  prefix: "rate:checkout",
  limiter: Ratelimit.slidingWindow(8, "10 m"),
});

const allowedResult: RatelimitResponse = {
  success: true,
  limit: Number.MAX_SAFE_INTEGER,
  remaining: Number.MAX_SAFE_INTEGER,
  reset: Date.now() + 1000,
};

function extractClientIp(value?: string | null) {
  if (!value) return null;

  const [first] = value.split(",");
  return first?.trim() || null;
}

function buildIdentifier({
  ip,
  forwardedFor,
  userId,
}: {
  ip?: string | null;
  forwardedFor?: string | null;
  userId?: string | null;
}) {
  return userId ?? ip ?? extractClientIp(forwardedFor) ?? "anonymous";
}

async function applyLimiter(limiter: Ratelimit, identifier: string) {
  try {
    return await limiter.limit(identifier);
  } catch (error) {
    console.error("Rate limit check failed", error);
    return allowedResult;
  }
}

export async function limitAuthRequest(req: NextRequest, userId?: string) {
  return applyLimiter(
    authLimiter,
    buildIdentifier({
      ip: req.ip,
      forwardedFor: req.headers.get("x-forwarded-for"),
      userId: userId ?? null,
    }),
  );
}

export async function limitApplicationSubmission(userId?: string | null) {
  const headerList = nextHeaders();
  return applyLimiter(
    applicationLimiter,
    buildIdentifier({ forwardedFor: headerList.get("x-forwarded-for"), userId: userId ?? null }),
  );
}

export async function limitCheckoutRequest(req: NextRequest, userId?: string | null) {
  return applyLimiter(
    checkoutLimiter,
    buildIdentifier({
      ip: req.ip,
      forwardedFor: req.headers.get("x-forwarded-for"),
      userId: userId ?? null,
    }),
  );
}

export function buildRateLimitHeaders(result: RatelimitResponse): Record<string, string> {
  return {
    "RateLimit-Limit": `${result.limit}`,
    "RateLimit-Remaining": `${result.remaining}`,
    "RateLimit-Reset": `${result.reset}`,
  };
}

export function rateLimitErrorResponse(result: RatelimitResponse) {
  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        ...buildRateLimitHeaders(result),
        "Retry-After": `${retryAfterSeconds}`,
      },
    },
  );
}
