-- Alter events to store RSVP deadlines
ALTER TABLE "Event"
ADD COLUMN IF NOT EXISTS "rsvpDeadline" TIMESTAMP(3);

-- Track refund metadata on payments
ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT,
ADD COLUMN IF NOT EXISTS "refundedAmount" INTEGER,
ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeRefundId_key" ON "Payment" ("stripeRefundId");

-- Manage waitlist promotions
ALTER TABLE "EventRsvp"
ADD COLUMN IF NOT EXISTS "promotionHoldUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "promotionLockId" TEXT;
