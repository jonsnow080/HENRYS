import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { getStripe } from "@/lib/stripe/server";
import { handleStripeEvent } from "./processor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = headers().get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event, { prisma, sendEmail });
  } catch (error) {
    console.error("Stripe webhook handling error", error);
    return NextResponse.json({ received: true, retry: true }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
