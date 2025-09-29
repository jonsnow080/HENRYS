import crypto from "crypto";
import type Stripe from "stripe";
import { RsvpStatus } from "@/lib/prisma-constants";
import type { prisma as prismaClient } from "@/lib/prisma";
import type { SendEmail } from "@/lib/email/send";
import {
  waitlistPromotionTemplate,
  waitlistCheckoutTemplate,
} from "@/lib/email/templates";
import { formatCurrency, formatDate } from "@/lib/utils";

const HOLD_MINUTES = 30;

export type PrismaLike = typeof prismaClient;

export type StripeLike = Pick<Stripe, "paymentIntents" | "paymentMethods" | "checkout">;

export type PromotionDependencies = {
  prisma: PrismaLike;
  stripe: StripeLike;
  sendEmail: SendEmail;
  getBaseUrl: () => string;
  now?: () => Date;
};

export type PromotionResult =
  | { status: "event_not_found" }
  | { status: "no_waitlist" }
  | { status: "promoted"; userId: string; rsvpId: string }
  | { status: "checkout_link_sent"; userId: string; rsvpId: string; expiresAt: Date }
  | { status: "skipped"; reason: string };

export async function promoteNextWaitlistedRsvp(
  eventId: string,
  deps: PromotionDependencies,
): Promise<PromotionResult> {
  const now = deps.now ? deps.now() : new Date();
  const event = await deps.prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { status: "event_not_found" };
  }

  const waitlist = await deps.prisma.eventRsvp.findMany({
    where: { eventId: event.id, status: RsvpStatus.WAITLISTED },
    orderBy: { createdAt: "asc" },
  });

  let candidate = null;
  for (const rsvp of waitlist) {
    if (rsvp.promotionHoldUntil && rsvp.promotionHoldUntil <= now) {
      await deps.prisma.eventRsvp.update({
        where: { id: rsvp.id },
        data: { promotionHoldUntil: null, promotionLockId: null },
      });
      rsvp.promotionHoldUntil = null;
      rsvp.promotionLockId = null;
    }
    if (!rsvp.promotionHoldUntil && !rsvp.promotionLockId && !candidate) {
      candidate = rsvp;
    }
  }

  if (!candidate) {
    return { status: "no_waitlist" };
  }

  const lockId = crypto.randomUUID();
  await deps.prisma.eventRsvp.update({
    where: { id: candidate.id },
    data: { promotionLockId: lockId, promotionHoldUntil: now },
  });

  const user = await deps.prisma.user.findUnique({ where: { id: candidate.userId } });
  if (!user || !user.email) {
    await releaseHold(deps, candidate.id);
    return { status: "skipped", reason: "user_missing" };
  }

  if (event.priceCents <= 0) {
    await deps.prisma.eventRsvp.update({
      where: { id: candidate.id },
      data: {
        status: RsvpStatus.GOING,
        promotionHoldUntil: null,
        promotionLockId: null,
      },
    });
    await deps.sendEmail({
      to: user.email,
      subject: `You’re confirmed for ${event.name}`,
      mjml: waitlistPromotionTemplate({
        name: user.name ?? user.email,
        eventName: event.name,
        eventDate: formatDate(event.startAt),
        price: "complimentary",
      }),
    });
    return { status: "promoted", userId: user.id, rsvpId: candidate.id };
  }

  const subscription = await deps.prisma.subscription.findFirst({ where: { userId: user.id } });
  const customerId = subscription?.stripeCustomerId ?? null;

  if (customerId) {
    const paymentMethod = await getDefaultPaymentMethod(deps, customerId);
    if (paymentMethod) {
      const paymentIntent = await attemptOffSessionCharge({
        deps,
        event,
        userId: user.id,
        customerId,
        paymentMethodId: paymentMethod,
        lockId,
      });
      if (paymentIntent?.status === "succeeded") {
        await deps.prisma.eventRsvp.update({
          where: { id: candidate.id },
          data: {
            status: RsvpStatus.GOING,
            promotionHoldUntil: null,
            promotionLockId: null,
          },
        });
        await deps.sendEmail({
          to: user.email,
          subject: `You’re confirmed for ${event.name}`,
          mjml: waitlistPromotionTemplate({
            name: user.name ?? user.email,
            eventName: event.name,
            eventDate: formatDate(event.startAt),
            price: formatCurrency(event.priceCents, event.currency),
          }),
        });
        return { status: "promoted", userId: user.id, rsvpId: candidate.id };
      }
    }
  }

  let checkoutSession: Stripe.Checkout.Session;
  try {
    checkoutSession = await createCheckoutSession({
      deps,
      event,
      user,
      customerId,
    });
  } catch (error) {
    console.warn("waitlist promotion checkout creation failed", error);
    await releaseHold(deps, candidate.id);
    return { status: "skipped", reason: "checkout_failed" };
  }
  const holdUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
  await deps.prisma.eventRsvp.update({
    where: { id: candidate.id },
    data: {
      promotionHoldUntil: holdUntil,
      promotionLockId: null,
    },
  });

  await deps.sendEmail({
    to: user.email,
    subject: `Claim your spot for ${event.name}`,
    mjml: waitlistCheckoutTemplate({
      name: user.name ?? user.email,
      eventName: event.name,
      eventDate: formatDate(event.startAt),
      checkoutUrl: checkoutSession.url ?? deps.getBaseUrl(),
      holdMinutes: HOLD_MINUTES,
      price: formatCurrency(event.priceCents, event.currency),
    }),
  });

  return { status: "checkout_link_sent", userId: user.id, rsvpId: candidate.id, expiresAt: holdUntil };
}

async function releaseHold(deps: PromotionDependencies, rsvpId: string) {
  await deps.prisma.eventRsvp.update({
    where: { id: rsvpId },
    data: { promotionHoldUntil: null, promotionLockId: null },
  });
}

async function getDefaultPaymentMethod(deps: PromotionDependencies, customerId: string) {
  try {
    const methods = await deps.stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });
    return methods.data[0]?.id ?? null;
  } catch (error) {
    console.warn("waitlist promotion payment method lookup failed", error);
    return null;
  }
}

async function attemptOffSessionCharge({
  deps,
  event,
  userId,
  customerId,
  paymentMethodId,
  lockId,
}: {
  deps: PromotionDependencies;
  event: { id: string; name: string; currency: string; priceCents: number };
  userId: string;
  customerId: string;
  paymentMethodId: string;
  lockId: string;
}) {
  try {
    const paymentIntent = await deps.stripe.paymentIntents.create(
      {
        amount: event.priceCents,
        currency: event.currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          type: "event_waitlist",
          eventId: event.id,
          userId,
          description: `${event.name} ticket`,
          promotionLockId: lockId,
        },
      },
      {
        idempotencyKey: `waitlist:${event.id}:${userId}`,
      },
    );
    return paymentIntent;
  } catch (error) {
    console.warn("waitlist promotion charge failed", error);
    return null;
  }
}

async function createCheckoutSession({
  deps,
  event,
  user,
  customerId,
}: {
  deps: PromotionDependencies;
  event: { id: string; name: string; summary?: string | null; currency: string; priceCents: number };
  user: { id: string; email: string; name?: string | null };
  customerId: string | null;
}) {
  const baseUrl = deps.getBaseUrl();
  return deps.stripe.checkout.sessions.create({
    mode: "payment",
    ...(customerId ? { customer: customerId } : { customer_email: user.email }),
    success_url: `${baseUrl}/events/${event.id}?checkout=success`,
    cancel_url: `${baseUrl}/events/${event.id}?checkout=cancelled`,
    line_items: [
      {
        price_data: {
          currency: event.currency,
          product_data: {
            name: event.name,
            description: event.summary ?? undefined,
          },
          unit_amount: event.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "event_waitlist",
      eventId: event.id,
      userId: user.id,
      description: `${event.name} ticket`,
    },
    client_reference_id: `${event.id}:${user.id}:waitlist`,
  });
}
