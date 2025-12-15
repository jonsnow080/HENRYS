"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RsvpStatus } from "@/lib/prisma-constants";

export async function rsvpToEvent(eventId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("You must be logged in to RSVP.");
    }

    const userId = session.user.id;

    const [user, event, subscription] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        }),
        prisma.event.findUnique({
            where: { id: eventId },
        }),
        prisma.subscription.findFirst({
            where: { userId, status: "active" },
            include: { plan: true },
        }),
    ]);

    if (!user || !event) {
        throw new Error("User or event not found.");
    }

    // Check if already RSVPed
    const existingRsvp = await prisma.eventRsvp.findFirst({
        where: { userId, eventId },
    });

    if (existingRsvp) {
        if (existingRsvp.status === RsvpStatus.GOING) {
            throw new Error("You are already going to this event.");
        }
        // If they were cancelled/waitlisted, we might allow re-RSVP, but let's keep it simple for now.
        // Re-activating a cancelled RSVP might consume a credit?
        // For now, let's assume if they have a record, we just update it if it's not going?
        // Or maybe just block for simplicity and assume UI handles state.
    }

    // Logic for limits
    if (subscription?.plan?.monthlyEventLimit) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const rsvpsThisMonth = await prisma.eventRsvp.count({
            where: {
                userId,
                status: RsvpStatus.GOING,
                event: {
                    startAt: {
                        gte: firstDayOfMonth,
                        lt: nextMonth
                    }
                }
            }
        });

        if (rsvpsThisMonth >= subscription.plan.monthlyEventLimit) {
            throw new Error(`You have reached your limit of ${subscription.plan.monthlyEventLimit} event(s) for this month.`);
        }
    }

    // If no subscription, maybe we don't allow RSVP? Or assume guest?
    // User request implies members have these tiers. "Cheapest tier..."
    // Non-members (Guests) presumably can't RSVP for free?
    // The prompt says "cheapest tier will give a member access to one free event".
    // Assuming users without subscription cannot RSVP for free.

    if (!subscription) {
        // If event has a price, they should use the purchase flow.
        // If event is free (priceCents == 0), maybe guests can RSVP?
        // Let's assume for this feature, we are enforcing member limits.
        // If user has no subscription, and event is free, maybe they can go?
        // But the requirement is about tiers.
        // Let's allow if price is 0, but if price > 0 they must pay.
        // The "PurchaseTicketForm" handles paid events.
        // This action is likely for the "free for members" aspect.
        // But wait, "one free event per month" implies paid events are different?
        // Or does it mean they get one ticket for free?
        // "access to one free event" usually means access to the event itself.
        // Let's assume if they have a plan, they can RSVP freely up to limit.

        if (event.priceCents > 0) {
            throw new Error("This event requires a ticket purchase.");
        }
    }

    await prisma.eventRsvp.upsert({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
        update: {
            status: RsvpStatus.GOING,
        },
        create: {
            userId,
            eventId,
            status: RsvpStatus.GOING,
        },
    });

    revalidatePath(`/events/${eventId}`);
    return { success: true };
}
