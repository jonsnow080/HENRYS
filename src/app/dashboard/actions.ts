"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RsvpStatus } from "@/lib/prisma-constants";

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
        },
    });

    if (!rsvp) {
        // Check if it was already cancelled or never existed
        // If we want to be idempotent and silent, we could return success.
        // But for UI feedback, throwing or returning error might be better.
        // However, if it's already gone from the list, the user shouldn't be clicking.
        throw new Error("RSVP not found");
    }

    if (rsvp.status === RsvpStatus.CANCELED) {
        return { success: true, message: "Already canceled" };
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

    // Create an audit log for the cancellation? (Optional but good practice)
    // For now, keeping it simple as per plan.

    revalidatePath("/dashboard");
    return { success: true };
}
