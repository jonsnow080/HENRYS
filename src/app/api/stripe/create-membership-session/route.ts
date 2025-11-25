import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildRateLimitHeaders, limitCheckoutRequest, rateLimitErrorResponse } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe/server";
import { getBaseUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await limitCheckoutRequest(req, session.user.id);
  if (!rateLimitResult.success) {
    return rateLimitErrorResponse(rateLimitResult);
  }

  const { planId } = (await req.json().catch(() => ({}))) as { planId?: string };
  if (!planId) {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  }

  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const stripe = getStripe();
  const baseUrl = getBaseUrl();

  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
  });

  const sessionParams = {
    mode: "subscription",
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=cancelled`,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      type: "membership",
      userId: session.user.id,
      planId: plan.id,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        description: `${plan.name} membership`,
      },
    },
    custom_fields: [
      {
        key: "food_drink_ack",
        label: {
          type: "custom",
          custom: "I understand tickets/membership do not include food/drink",
        },
        type: "checkbox",
        checkbox: { required: true },
      },
    ],
    ...(existingSubscription?.stripeCustomerId
      ? { customer: existingSubscription.stripeCustomerId }
      : { customer_email: session.user.email }),
  } as unknown as Stripe.Checkout.SessionCreateParams;

  const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

  const response = NextResponse.json({ sessionId: checkoutSession.id });
  const headers = buildRateLimitHeaders(rateLimitResult);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
