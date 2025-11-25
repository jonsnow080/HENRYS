import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { getStripe } from "@/lib/stripe/server";
import { handleStripeEvent } from "./processor";

export const runtime = "nodejs";

export const POST = Sentry.wrapRouteHandlerWithSentry(async function POST(req: NextRequest) {
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  const idempotencyKey =
    headersList.get("stripe-idempotency-key") ?? headersList.get("idempotency-key");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    Sentry.captureException(error, {
      data: { idempotencyKey },
      tags: { scope: "stripe-webhook" },
    });
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const log = (message: string, metadata: Record<string, unknown> = {}) =>
    console.info(message, {
      eventType: event.type,
      eventId: event.id,
      idempotencyKey,
      ...metadata,
    });

  log("Stripe webhook received");

  try {
    await handleStripeEvent(event, { prisma, sendEmail }, { log });
  } catch (error) {
    Sentry.captureException(error, {
      data: { eventId: event.id, eventType: event.type, idempotencyKey },
      tags: { scope: "stripe-webhook" },
    });
    console.error("Stripe webhook handling error", error);
    return NextResponse.json({ received: true, retry: true }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}, "stripe-webhook");
