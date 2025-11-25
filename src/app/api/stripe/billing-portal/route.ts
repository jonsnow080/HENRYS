import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildRateLimitHeaders, limitCheckoutRequest, rateLimitErrorResponse } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe/server";
import { getBaseUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await limitCheckoutRequest(req, session.user.id);
  if (!rateLimitResult.success) {
    return rateLimitErrorResponse(rateLimitResult);
  }

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["active", "trialing", "past_due"] },
    },
  });

  if (!activeSubscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription" }, { status: 400 });
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: activeSubscription.stripeCustomerId,
    return_url: `${getBaseUrl()}/dashboard?billing=return`,
  });

  const response = NextResponse.json({ url: portalSession.url });
  const headers = buildRateLimitHeaders(rateLimitResult);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
