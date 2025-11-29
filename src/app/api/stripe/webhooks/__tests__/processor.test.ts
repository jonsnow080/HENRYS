import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  handleSubscriptionEvent,
  handleChargeSucceeded,
  handleCheckoutSessionCompleted,
  type StripeWebhookDependencies,
  type StripeWebhookContext,
} from "../processor";
import { RsvpStatus } from "@/lib/prisma-constants";

function createDeps(overrides: Partial<StripeWebhookDependencies["prisma"]> = {}) {
  const membershipPlan = {
    findUnique: vi.fn().mockResolvedValue({ id: "plan_123", name: "Founding Monthly" }),
  };
  Object.assign(membershipPlan, overrides.membershipPlan ?? {});

  const subscription = {
    findFirst: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({
      id: "subscription_123",
      userId: "user_123",
      planId: "plan_123",
      status: "active",
      stripeCustomerId: "cus_123",
    }),
    update: vi.fn().mockResolvedValue({
      id: "subscription_123",
      planId: "plan_123",
      status: "active",
    }),
  };
  Object.assign(subscription, overrides.subscription ?? {});

  const payment = {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: "payment_123",
      createdAt: new Date(),
      ...args.data,
    })),
    update: vi.fn().mockResolvedValue({ id: "payment_123", status: "succeeded" }),
  };
  Object.assign(payment, overrides.payment ?? {});

  const user = {
    findUnique: vi.fn().mockResolvedValue({ id: "user_123", email: "member@example.com" }),
  };
  Object.assign(user, overrides.user ?? {});

  const event = {
    findUnique: vi.fn().mockResolvedValue({ id: "event_123", name: "Salon" }),
  };
  Object.assign(event, overrides.event ?? {});

  const eventRsvp = {
    upsert: vi.fn().mockResolvedValue({ eventId: "event_123", userId: "user_123", status: RsvpStatus.GOING }),
    findFirst: vi.fn().mockResolvedValue(null),
  };
  Object.assign(eventRsvp, overrides.eventRsvp ?? {});
  const deps: StripeWebhookDependencies = {
    prisma: {
      membershipPlan,
      subscription,
      payment,
      user,
      event,
      eventRsvp,
    } as unknown as StripeWebhookDependencies["prisma"],
    sendEmail: vi.fn(),
  };
  return deps;
}

describe("stripe webhook processor", () => {
  it("upserts subscriptions from Stripe events", async () => {
    const deps = createDeps();
    const context: StripeWebhookContext = {
      eventId: "evt_subscription",
      eventType: "customer.subscription.updated",
    };
    const subscriptionEvent = {
      customer: "cus_123",
      status: "active",
      metadata: { userId: "user_123" },
      items: { data: [{ price: { id: "price_123" } }] },
      current_period_end: Math.floor(Date.now() / 1000),
    } as unknown as Stripe.Subscription;

    await handleSubscriptionEvent(subscriptionEvent, deps, context);

    expect(deps.prisma.membershipPlan.findUnique).toHaveBeenCalledWith({
      where: { stripePriceId: "price_123" },
    });
    expect(deps.prisma.subscription.upsert).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
      create: expect.objectContaining({ userId: "user_123", planId: "plan_123", status: "active" }),
      update: expect.objectContaining({ userId: "user_123", planId: "plan_123" }),
    });
  });

  it("creates payments and emails receipts on successful charges", async () => {
    const deps = createDeps();
    const context: StripeWebhookContext = {
      eventId: "evt_payment",
      eventType: "charge.succeeded",
    };
    const charge = {
      payment_intent: "pi_123",
      amount: 4500,
      currency: "usd",
      status: "succeeded",
      receipt_url: "https://stripe.example/receipt",
      metadata: {
        userId: "user_123",
        description: "Salon ticket",
      },
    } as unknown as Stripe.Charge;

    await handleChargeSucceeded(charge, deps, context);

    expect(deps.prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_123",
        amount: 4500,
        currency: "usd",
        description: "Salon ticket",
        stripePaymentIntentId: "pi_123",
      }),
    });
    expect(deps.sendEmail).toHaveBeenCalled();
  });

  it("marks RSVP as going when checkout completes", async () => {
    const deps = createDeps();
    const context: StripeWebhookContext = {
      eventId: "evt_checkout",
      eventType: "checkout.session.completed",
    };
    const session = {
      mode: "payment",
      payment_status: "paid",
      metadata: {
        userId: "user_123",
        eventId: "event_123",
        type: "event",
      },
    } as unknown as Stripe.Checkout.Session;

    await handleCheckoutSessionCompleted(session, deps, context);

    expect(deps.prisma.eventRsvp.upsert).toHaveBeenCalledWith({
      where: { userId_eventId: { userId: "user_123", eventId: "event_123" } },
      update: { status: RsvpStatus.GOING },
      create: { userId: "user_123", eventId: "event_123", status: RsvpStatus.GOING },
    });
  });
});
