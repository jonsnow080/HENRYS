import { captureException, wrapRouteHandlerWithSentry } from "@sentry/nextjs";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createStripeWebhookLogger } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { getStripe } from "@/lib/stripe/server";
import { handleStripeEvent } from "./processor";

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  const idempotencyKey = headersList.get("idempotency-key");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  const log = createStripeWebhookLogger({ idempotencyKey });

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    log({
      action: "signature.verification.failed",
      message: "Stripe webhook signature verification failed",
      success: false,
    });
    captureException(error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const eventLogger = createStripeWebhookLogger({
      eventId: event.id,
      eventType: event.type,
      idempotencyKey,
    });

    eventLogger({
      action: "validated",
      message: "Stripe webhook signature verified",
      success: true,
    });

    await handleStripeEvent(event, { prisma, sendEmail }, {
      eventId: event.id,
      eventType: event.type,
      idempotencyKey,
      log: eventLogger,
    });
  } catch (error) {
    const eventLogger = createStripeWebhookLogger({
      eventId: event.id,
      eventType: event.type,
      idempotencyKey,
    });
    eventLogger({
      action: "processing.failed",
      message: "Stripe webhook handling error",
      success: false,
    });
    captureException(error);
    return NextResponse.json({ received: true, retry: true }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const POST = wrapRouteHandlerWithSentry(handler, {
  method: "POST",
  parameterizedRoute: "/api/stripe/webhooks",
});
