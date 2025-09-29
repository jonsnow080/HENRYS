import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { calculateRefundQuote } from "../policies";

describe("calculateRefundQuote", () => {
  const baseEvent = {
    id: "event",
    startAt: new Date("2024-07-30T20:00:00.000Z"),
    rsvpDeadline: null,
    priceCents: 5000,
    currency: "usd",
  };

  const basePayment = {
    id: "payment",
    amount: 5000,
    currency: "usd",
    status: "succeeded",
    refundedAmount: 0,
  };

  let originalWindow: string | undefined;
  let originalPercent: string | undefined;

  beforeEach(() => {
    originalWindow = process.env.CANCEL_REFUND_WINDOW_HOURS;
    originalPercent = process.env.CANCEL_REFUND_INSIDE_PERCENT;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      process.env.CANCEL_REFUND_WINDOW_HOURS = originalWindow;
    } else {
      delete process.env.CANCEL_REFUND_WINDOW_HOURS;
    }
    if (originalPercent !== undefined) {
      process.env.CANCEL_REFUND_INSIDE_PERCENT = originalPercent;
    } else {
      delete process.env.CANCEL_REFUND_INSIDE_PERCENT;
    }
  });

  it("returns full refund when cancelling before window closes", () => {
    process.env.CANCEL_REFUND_WINDOW_HOURS = "48";
    const now = new Date("2024-07-28T18:00:00.000Z");
    const quote = calculateRefundQuote({ event: baseEvent, payment: basePayment, now });
    expect(quote.amountCents).toBe(5000);
    expect(quote.reason).toBe("full_refund");
  });

  it("returns partial refund when inside window with percentage", () => {
    process.env.CANCEL_REFUND_WINDOW_HOURS = "48";
    process.env.CANCEL_REFUND_INSIDE_PERCENT = "50";
    const now = new Date("2024-07-30T02:00:00.000Z");
    const quote = calculateRefundQuote({ event: baseEvent, payment: basePayment, now });
    expect(quote.amountCents).toBe(2500);
    expect(quote.reason).toBe("partial_refund");
  });

  it("returns zero when no payment is recorded", () => {
    const quote = calculateRefundQuote({ event: baseEvent, payment: null, now: new Date() });
    expect(quote.amountCents).toBe(0);
    expect(quote.reason).toBe("no_payment");
  });
});
