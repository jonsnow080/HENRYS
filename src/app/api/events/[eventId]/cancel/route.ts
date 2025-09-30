import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/server";
import { sendEmail } from "@/lib/email/send";
import { formatCurrency, getBaseUrl } from "@/lib/utils";
import { RsvpStatus } from "@/lib/prisma-constants";
import {
  calculateRefundQuote,
  describeRefundQuote,
  getCancellationDeadline,
} from "@/lib/events/policies";
import { refundNotificationTemplate } from "@/lib/email/templates";
import { promoteNextWaitlistedRsvp } from "@/lib/events/promotion";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const rsvp = await prisma.eventRsvp.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });

  if (!rsvp || rsvp.status !== RsvpStatus.GOING) {
    return NextResponse.json({ error: "You’re not marked as going" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.email) {
    return NextResponse.json({ error: "User record missing email" }, { status: 400 });
  }

  const payments = await prisma.payment.findMany({
    where: { userId: user.id, eventId: event.id },
    orderBy: { createdAt: "desc" },
  });
  const payment = payments[0] ?? null;

  const now = new Date();
  const refundQuote = calculateRefundQuote({
    event,
    payment: payment
      ? {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          refundedAmount: payment.refundedAmount ?? 0,
        }
      : null,
    now,
  });

  const stripe = getStripe();
  let refundId: string | null = null;

  if (payment && refundQuote.amountCents > 0) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: refundQuote.amountCents,
      });
      refundId = refund.id;
      await prisma.payment.update({
        where: { stripePaymentIntentId: payment.stripePaymentIntentId },
        data: {
          status: refundQuote.amountCents >= payment.amount ? "refunded" : "partial_refund",
          refundedAmount: (payment.refundedAmount ?? 0) + refundQuote.amountCents,
          refundedAt: now,
          stripeRefundId: refund.id,
        },
      });
    } catch (error) {
      console.error("Refund failed", error);
      return NextResponse.json({ error: "Refund failed" }, { status: 502 });
    }
  }

  await prisma.eventRsvp.update({
    where: { userId_eventId: { userId: user.id, eventId: event.id } },
    data: {
      status: RsvpStatus.CANCELED,
      promotionHoldUntil: null,
      promotionLockId: null,
    },
  });

  const refundAmountLabel =
    refundQuote.amountCents > 0 ? formatCurrency(refundQuote.amountCents, event.currency) : null;
  const refundMessage = describeRefundQuote(refundQuote);
  await sendEmail({
    to: user.email,
    subject: `${event.name} cancellation confirmed`,
    mjml: refundNotificationTemplate({
      name: user.name ?? user.email,
      eventName: event.name,
      amountLabel: refundAmountLabel,
      message: refundMessage,
    }),
  });

  const deadline = getCancellationDeadline(event);
  let promotionStatus: string | null = null;
  if (!deadline || now <= deadline) {
    try {
      const promotion = await promoteNextWaitlistedRsvp(event.id, {
        prisma,
        stripe,
        sendEmail,
        getBaseUrl,
      });
      promotionStatus = promotion.status;
    } catch (error) {
      console.warn("Waitlist promotion failed", error);
      promotionStatus = "error";
    }
  }

  return NextResponse.json({
    status: "cancelled",
    refund: {
      amount: refundQuote.amountCents,
      currency: event.currency,
      stripeRefundId: refundId,
    },
    promotionStatus,
  });
}
