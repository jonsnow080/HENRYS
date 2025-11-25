import type { NextRequest } from "next/server";

import { GET as nextAuthGet, POST as nextAuthPost } from "@/auth";
import { buildRateLimitHeaders, limitAuthRequest, rateLimitErrorResponse } from "@/lib/rate-limit";

async function handleRequest(req: NextRequest, handler: typeof nextAuthGet) {
  const rateLimitResult = await limitAuthRequest(req);
  if (!rateLimitResult.success) {
    return rateLimitErrorResponse(rateLimitResult);
  }

  const response = await handler(req);
  const headers = buildRateLimitHeaders(rateLimitResult);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function GET(req: NextRequest) {
  return handleRequest(req, nextAuthGet);
}

export async function POST(req: NextRequest) {
  return handleRequest(req, nextAuthPost);
}
