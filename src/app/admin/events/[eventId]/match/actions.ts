"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit-log";

export type SaveSeatingState = {
  status?: "success" | "error";
  message?: string;
  updated?: number;
};

export async function saveSeatingAssignmentsAction(
  _prevState: SaveSeatingState,
  formData: FormData,
): Promise<SaveSeatingState> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { status: "error", message: "Unauthorized." };
  }

  const eventIdEntry = formData.get("eventId");
  const payloadRawEntry = formData.get("assignments");
  if (typeof eventIdEntry !== "string" || typeof payloadRawEntry !== "string") {
    return { status: "error", message: "Missing assignment payload." };
  }
  const eventId = eventIdEntry;
  const payloadRaw = payloadRawEntry;

  let assignments: { rsvpId: string; seatGroupId: string | null }[] = [];
  try {
    assignments = JSON.parse(payloadRaw) as { rsvpId: string; seatGroupId: string | null }[];
  } catch (error) {
    console.error("Failed to parse seating assignments", error);
    return { status: "error", message: "Invalid assignment payload." };
  }

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return { status: "error", message: "Provide at least one assignment to save." };
  }

  const rsvps = await prisma.eventRsvp.findMany({ where: { eventId } });
  const rsvpMap = new Map<string, (typeof rsvps)[number]>();
  for (const rsvp of rsvps) {
    rsvpMap.set(rsvp.id, rsvp);
  }

  const updates = assignments.filter((assignment) => {
    const current = rsvpMap.get(assignment.rsvpId);
    if (!current) return false;
    const nextSeat = assignment.seatGroupId ?? null;
    return current.seatGroupId !== nextSeat;
  });

  if (updates.length === 0) {
    return { status: "success", message: "No seating changes detected.", updated: 0 };
  }

  for (const update of updates) {
    await prisma.eventRsvp.update({
      where: { id: update.rsvpId },
      data: {
        seatGroupId: update.seatGroupId ?? null,
      },
    });

    await recordAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email ?? null,
      action: "event.seating.assign",
      targetType: "eventRsvp",
      targetId: update.rsvpId,
      diff: {
        previousSeat: rsvpMap.get(update.rsvpId)?.seatGroupId ?? null,
        nextSeat: update.seatGroupId ?? null,
      },
    });
  }

  revalidatePath(`/admin/events/${eventId}/match`);

  return {
    status: "success",
    message: `Updated ${updates.length} assignment${updates.length === 1 ? "" : "s"}.`,
    updated: updates.length,
  };
}
