import type Stripe from "stripe";
import { RsvpStatus } from "@/lib/prisma-constants";
import type { prisma as prismaClient } from "@/lib/prisma";
import type { sendEmail as sendEmailFn } from "@/lib/email/send";
import { paymentReceiptTemplate } from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";

export type PrismaClientLike = typeof prismaClient;
export type SendEmail = typeof sendEmailFn;

export type StripeWebhookDependencies = {
  prisma: PrismaClientLike;
  sendEmail: SendEmail;
};

export type StripeWebhookContext = {
  log: (message: string, details?: Record<string, unknown>) => void;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<string>([
  "active",
  "trialing",
  "past_due",
]);

export async function handleStripeEvent(
  event: Stripe.Event,
  deps: StripeWebhookDependencies,
  context?: StripeWebhookContext,
) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription, deps, context);
      break;
    case "charge.succeeded":
      await handleChargeSucceeded(event.data.object as Stripe.Charge, deps, context);
      break;
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
        deps,
        context,
      );
      break;
    default:
      break;
  }
}

async function handleSubscriptionEvent(
  subscription: Stripe.Subscription,
  deps: StripeWebhookDependencies,
  context?: StripeWebhookContext,
) {
  const stripeCustomerId = resolveId(subscription.customer);
  if (!stripeCustomerId) return;

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const plan = await deps.prisma.membershipPlan.findUnique({
    where: { stripePriceId: priceId },
  });
  if (!plan) return;

  const userId = subscription.metadata?.userId;
  if (!userId) {
    const existing = await deps.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });
    if (!existing) return;
    const result = await deps.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId: plan.id,
        status: subscription.status,
        currentPeriodEnd: getCurrentPeriodEndDate(subscription),
      },
    });
    context?.log("Stripe subscription updated", {
      stripeCustomerId,
      planId: plan.id,
      subscriptionId: result.id,
      status: subscription.status,
    });
    return;
  }

  const upsertedSubscription = await deps.prisma.subscription.upsert({
    where: { stripeCustomerId },
    create: {
      userId,
      planId: plan.id,
      status: subscription.status,
      currentPeriodEnd: getCurrentPeriodEndDate(subscription),
      stripeCustomerId,
    },
    update: {
      userId,
      planId: plan.id,
      status: subscription.status,
      currentPeriodEnd: getCurrentPeriodEndDate(subscription),
    },
  });

  context?.log("Stripe subscription upserted", {
    stripeCustomerId,
    planId: plan.id,
    subscriptionId: upsertedSubscription.id,
    status: subscription.status,
    userId,
  });
}

async function handleChargeSucceeded(
  charge: Stripe.Charge,
  deps: StripeWebhookDependencies,
  context?: StripeWebhookContext,
) {
  const paymentIntentId = resolveId(charge.payment_intent);
  if (!paymentIntentId) return;

  const existing = await deps.prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (existing) {
    const updatedPayment = await deps.prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: charge.status ?? existing.status,
        receiptUrl: charge.receipt_url ?? existing.receiptUrl ?? undefined,
      },
    });
    context?.log("Stripe payment updated", {
      stripePaymentIntentId: paymentIntentId,
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
    });
    return;
  }

  const { userId, eventId, description } = await resolveChargeMetadata(charge, deps);
  if (!userId) return;

  const payment = await deps.prisma.payment.create({
    data: {
      userId,
      eventId: eventId ?? undefined,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status ?? "succeeded",
      stripePaymentIntentId: paymentIntentId,
      receiptUrl: charge.receipt_url ?? undefined,
      description,
    },
  });

  context?.log("Stripe payment created", {
    stripePaymentIntentId: paymentIntentId,
    paymentId: payment.id,
    userId,
    eventId,
    status: payment.status,
  });

  const user = await deps.prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  const prettyAmount = formatCurrency(payment.amount, payment.currency);
  const emailDescription =
    payment.description ??
    charge.description ??
    `Payment ${paymentIntentId.slice(0, 8).toUpperCase()}`;

  await deps.sendEmail({
    to: user.email,
    subject: `Receipt · ${prettyAmount}`,
    mjml: paymentReceiptTemplate({
      amount: prettyAmount,
      description: emailDescription,
      receiptUrl: payment.receiptUrl ?? undefined,
    }),
    text: `${emailDescription} — ${prettyAmount}`,
    tags: [
      { name: "category", value: "payment" },
      { name: "stripe_intent", value: paymentIntentId },
    ],
  });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeWebhookDependencies,
  context?: StripeWebhookContext,
) {
  const userId = session.metadata?.userId;
  const type = session.metadata?.type;

  if (session.mode === "payment" && session.payment_status === "paid") {
    const eventId = session.metadata?.eventId;
    if (userId && eventId) {
      const rsvp = await deps.prisma.eventRsvp.upsert({
        where: { userId_eventId: { userId, eventId } },
        update: { status: RsvpStatus.GOING },
        create: { userId, eventId, status: RsvpStatus.GOING },
      });
      context?.log("Stripe checkout session RSVPed", {
        eventId,
        userId,
        rsvpId: rsvp.id,
      });
    }
    return;
  }

  if (session.mode === "subscription" && userId) {
    const stripeCustomerId = resolveId(session.customer);
    const planId = session.metadata?.planId;
    const status = type === "membership" ? "active" : session.payment_status;
    if (!stripeCustomerId || !planId) return;
    const subscription = await deps.prisma.subscription.upsert({
      where: { stripeCustomerId },
      create: {
        userId,
        planId,
        status: typeof status === "string" ? status : "active",
        currentPeriodEnd: null,
        stripeCustomerId,
      },
      update: {
        userId,
      },
    });

    context?.log("Stripe subscription linked from checkout", {
      stripeCustomerId,
      subscriptionId: subscription.id,
      planId,
      userId,
      status,
    });
  }
}

function resolveId(
  value:
    | string
    | Stripe.ApiList<unknown>
    | Stripe.PaymentIntent
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if ("id" in value && typeof value.id === "string") return value.id;
  return null;
}

function getCurrentPeriodEndDate(subscription: Stripe.Subscription): Date | null {
  const raw = (subscription as Stripe.Subscription & { current_period_end?: number | null }).current_period_end;
  return toDate(typeof raw === "number" ? raw : null);
}

function toDate(timestamp?: number | null): Date | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000);
}

async function resolveChargeMetadata(
  charge: Stripe.Charge,
  deps: StripeWebhookDependencies,
): Promise<{ userId: string | null; eventId: string | null; description: string | null }> {
  let userId = charge.metadata?.userId ?? null;
  const eventId = charge.metadata?.eventId ?? null;
  let description = charge.metadata?.description ?? null;

  if (!userId && charge.customer) {
    const subscription = await deps.prisma.subscription.findFirst({
      where: { stripeCustomerId: resolveId(charge.customer) ?? undefined },
    });
    if (subscription) {
      userId = subscription.userId;
    }
  }

  if (!description && eventId) {
    const event = await deps.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (event) {
      description = `${event.name} ticket`;
    }
  }

  if (!description && userId) {
    const subscription = await deps.prisma.subscription.findFirst({
      where: { userId },
    });
    if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      const plan = await deps.prisma.membershipPlan.findUnique({
        where: { id: subscription.planId },
      });
      if (plan) {
        description = `${plan.name} membership`;
      }
    }
  }

  return { userId, eventId, description };
}

export {
  handleSubscriptionEvent,
  handleChargeSucceeded,
  handleCheckoutSessionCompleted,
};
