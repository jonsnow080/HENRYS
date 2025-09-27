"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { recordAuditLog } from "@/lib/audit-log";

function parseStatus(value: FormDataEntryValue | null): RsvpStatus | null {
  if (!value || typeof value !== "string") return null;
  const match = Object.values(RsvpStatus).find((status) => status === value);
  return match ?? null;
}

export async function updateRsvpStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const rsvpId = typeof formData.get("rsvpId") === "string" ? formData.get("rsvpId") : null;
  const eventId = typeof formData.get("eventId") === "string" ? formData.get("eventId") : null;
  const redirectTo = typeof formData.get("redirectTo") === "string" ? formData.get("redirectTo") : "/admin/events";
  const nextStatus = parseStatus(formData.get("status"));

  if (!rsvpId || !eventId || !nextStatus) {
    redirect(redirectTo);
  }

  const rsvp = await prisma.eventRsvp.findUnique({ where: { id: rsvpId } });
  if (!rsvp || rsvp.eventId !== eventId) {
    redirect(redirectTo);
  }

  await prisma.eventRsvp.update({
    where: { id: rsvpId },
    data: {
      status: nextStatus,
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email ?? null,
    action: "event.rsvp.status",
    targetType: "eventRsvp",
    targetId: rsvpId,
    diff: {
      previous: rsvp.status,
      next: nextStatus,
    },
  });

  revalidatePath(`/admin/events/${eventId}/rsvps`);
  redirect(redirectTo);
}

export async function toggleNoShowAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const rsvpId = typeof formData.get("rsvpId") === "string" ? formData.get("rsvpId") : null;
  const eventId = typeof formData.get("eventId") === "string" ? formData.get("eventId") : null;
  const redirectTo = typeof formData.get("redirectTo") === "string" ? formData.get("redirectTo") : "/admin/events";

  if (!rsvpId || !eventId) {
    redirect(redirectTo);
  }

  const rsvp = await prisma.eventRsvp.findUnique({ where: { id: rsvpId } });
  if (!rsvp || rsvp.eventId !== eventId) {
    redirect(redirectTo);
  }

  const nextNoShow = !rsvp.noShow;

  await prisma.eventRsvp.update({
    where: { id: rsvpId },
    data: {
      noShow: nextNoShow,
      attended: nextNoShow ? false : rsvp.attended,
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email ?? null,
    action: "event.rsvp.noShow",
    targetType: "eventRsvp",
    targetId: rsvpId,
    diff: {
      previous: rsvp.noShow,
      next: nextNoShow,
    },
  });

  revalidatePath(`/admin/events/${eventId}/rsvps`);
  redirect(redirectTo);
}
