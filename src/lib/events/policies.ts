export type EventLike = {
  id: string;
  startAt: Date;
  rsvpDeadline: Date | null;
  priceCents: number;
  currency: string;
};

export type PaymentLike = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  refundedAmount: number | null;
};

export type RefundReason =
  | "free_event"
  | "no_payment"
  | "already_refunded"
  | "full_refund"
  | "partial_refund"
  | "no_refund";

export type RefundQuote = {
  amountCents: number;
  percent: number;
  currency: string;
  reason: RefundReason;
  windowHours: number;
  insideWindow: boolean;
  refundableRemainingCents: number;
};

const DEFAULT_WINDOW_HOURS = 48;
const DEFAULT_PARTIAL_PERCENT = 0;

export function getCancellationDeadline(event: EventLike): Date {
  return event.rsvpDeadline ?? event.startAt;
}

export function getRefundPolicyConfig() {
  const windowHours = Number(process.env.CANCEL_REFUND_WINDOW_HOURS ?? DEFAULT_WINDOW_HOURS);
  const partialPercent = Number(process.env.CANCEL_REFUND_INSIDE_PERCENT ?? DEFAULT_PARTIAL_PERCENT);
  return {
    windowHours: Number.isFinite(windowHours) && windowHours >= 0 ? windowHours : DEFAULT_WINDOW_HOURS,
    partialPercent:
      Number.isFinite(partialPercent) && partialPercent >= 0 && partialPercent <= 100
        ? partialPercent
        : DEFAULT_PARTIAL_PERCENT,
  };
}

export function calculateRefundQuote({
  event,
  payment,
  now = new Date(),
}: {
  event: EventLike;
  payment: PaymentLike | null;
  now?: Date;
}): RefundQuote {
  const { windowHours, partialPercent } = getRefundPolicyConfig();
  const refundWindowStart = addHours(event.startAt, -windowHours);
  const insideWindow = !isBefore(now, refundWindowStart);

  if (event.priceCents <= 0) {
    return {
      amountCents: 0,
      percent: 0,
      currency: event.currency,
      reason: "free_event",
      windowHours,
      insideWindow,
      refundableRemainingCents: 0,
    };
  }

  if (!payment || payment.status !== "succeeded") {
    return {
      amountCents: 0,
      percent: 0,
      currency: event.currency,
      reason: "no_payment",
      windowHours,
      insideWindow,
      refundableRemainingCents: 0,
    };
  }

  const alreadyRefunded = payment.refundedAmount ?? 0;
  const refundableRemaining = Math.max(payment.amount - alreadyRefunded, 0);

  if (refundableRemaining <= 0) {
    return {
      amountCents: 0,
      percent: 0,
      currency: event.currency,
      reason: "already_refunded",
      windowHours,
      insideWindow,
      refundableRemainingCents: 0,
    };
  }

  if (!insideWindow) {
    return {
      amountCents: refundableRemaining,
      percent: 100,
      currency: event.currency,
      reason: "full_refund",
      windowHours,
      insideWindow,
      refundableRemainingCents: refundableRemaining,
    };
  }

  const percent = partialPercent;
  const amount = Math.min(Math.round((event.priceCents * percent) / 100), refundableRemaining);

  if (amount <= 0) {
    return {
      amountCents: 0,
      percent,
      currency: event.currency,
      reason: "no_refund",
      windowHours,
      insideWindow,
      refundableRemainingCents: refundableRemaining,
    };
  }

  return {
    amountCents: amount,
    percent,
    currency: event.currency,
    reason: "partial_refund",
    windowHours,
    insideWindow,
    refundableRemainingCents: refundableRemaining,
  };
}

export function describeRefundQuote(quote: RefundQuote): string {
  switch (quote.reason) {
    case "free_event":
      return "This salon is complimentary—cancelling simply releases your seat.";
    case "no_payment":
      return "We didn’t detect a successful ticket payment, so no refund is due.";
    case "already_refunded":
      return "This ticket has already been refunded in full.";
    case "full_refund":
      return "You’ll receive a full refund once the cancellation is confirmed.";
    case "partial_refund":
      return `You’ll receive a ${quote.percent}% refund (${formatCurrency(quote.amountCents, quote.currency)}).`;
    case "no_refund":
    default:
      if (quote.percent > 0) {
        return `Refunds inside the ${quote.windowHours}-hour window are capped at ${quote.percent}%, which rounds down to $0.`;
      }
      return `Cancellations inside the ${quote.windowHours}-hour window aren’t refundable.`;
  }
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
  }
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function isBefore(left: Date, right: Date): boolean {
  return left.getTime() < right.getTime();
}
