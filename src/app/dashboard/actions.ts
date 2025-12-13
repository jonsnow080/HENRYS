"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RsvpStatus, Role } from "@/lib/prisma-constants";
import { getStripe } from "@/lib/stripe/server";

const CANCELLATION_WINDOW_HOURS = 24;
const LATE_CANCELLATION_FEE_CENTS = 1000; // $10.00

export async function cancelRsvp(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Verify the RSVP exists and belongs to the user
    const rsvp = await prisma.eventRsvp.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
        include: {
            event: true,
            user: true, // Need user role for penalty logic
        },
    });

    if (!rsvp) {
        throw new Error("RSVP not found");
    }

    if (rsvp.status === RsvpStatus.CANCELED) {
        return { success: true, message: "Already canceled" };
    }

    const now = new Date();
    const eventStart = new Date(rsvp.event.startAt);
    const hoursUntilStart = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilStart < CANCELLATION_WINDOW_HOURS;

    // Check for payment
    const payment = await prisma.payment.findFirst({
        where: {
            userId,
            eventId,
            status: "succeeded", // Ensure we only look at successful payments
        },
    });

    if (payment) {
        if (isLateCancellation) {
            // CASE: Paid ticket, Late Cancellation -> No Refund
            // Just cancel the RSVP, keep the money.
            // We might want to log this decision.
        } else {
            // CASE: Paid ticket, Early Cancellation -> Full Refund
            try {
                const stripe = getStripe();
                if (payment.stripePaymentIntentId) {
                    await stripe.refunds.create({
                        payment_intent: payment.stripePaymentIntentId,
                        metadata: {
                            reason: "user_requested_cancellation",
                            eventId,
                            userId,
                        }
                    });

                    // Update payment status in our DB to indicate refund initiated?
                    // For now, we just rely on Stripe webhooks to eventually update us, 
                    // OR we update it here if schema supports it.
                    // Schema has `status` string. Let's update it.
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: "refunded" }
                    });
                }
            } catch (error) {
                console.error("Failed to process refund:", error);
                // We should probably still cancel the RSVP but warn, or fail?
                // If refund fails, we probably shouldn't cancel the RSVP without telling the user?
                // But usually this is reliable. Let's throw for now so user can retry or contact support.
                throw new Error("Failed to process refund. Please contact support.");
            }
        }
    } else {
        // Free ticket (Member)
        if (isLateCancellation && rsvp.user.role === Role.MEMBER) {
            // CASE: Member, Late Cancellation -> Penalty
            // Attempt to charge fee or log it.
            // For MVP: Log generic "penalty_owed" metadata or similar.
            // We don't have stored payment methods easily accessible without `setup_intent` or previous payment methods attached to customer.
            // We will attempt to find a customer ID and log it.
            console.log(`[PENALTY] User ${userId} cancelled late for event ${eventId}. Owe $10.`);

            // Implementation: We'll mark the RSVP with a note or flagged state if possible.
            // The schema has `preferences` Json, maybe abuse that? Or just rely on logs.
            // Let's rely on logs for this step as per plan.
        }
    }

    // Update status to CANCELED
    await prisma.eventRsvp.update({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
        data: {
            status: RsvpStatus.CANCELED,
        },
    });

    revalidatePath("/dashboard");
    return { success: true };
}
