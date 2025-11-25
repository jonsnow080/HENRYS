"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { recordAuditLog } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email/send";
import { eventArrivalSequenceTemplate } from "@/lib/email/templates";
import { formatDate } from "@/lib/utils";

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

  const rsvpIdEntry = formData.get("rsvpId");
  const eventIdEntry = formData.get("eventId");
  const redirectToEntry = formData.get("redirectTo");
  const statusEntry = formData.get("status");

  const redirectTo = typeof redirectToEntry === "string" ? redirectToEntry : "/admin/events";
  const rsvpId = typeof rsvpIdEntry === "string" ? rsvpIdEntry : null;
  const eventId = typeof eventIdEntry === "string" ? eventIdEntry : null;
  const nextStatus = parseStatus(statusEntry);

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

  const rsvpIdEntry = formData.get("rsvpId");
  const eventIdEntry = formData.get("eventId");
  const redirectToEntry = formData.get("redirectTo");

  const redirectTo = typeof redirectToEntry === "string" ? redirectToEntry : "/admin/events";
  const rsvpId = typeof rsvpIdEntry === "string" ? rsvpIdEntry : null;
  const eventId = typeof eventIdEntry === "string" ? eventIdEntry : null;

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

export async function sendArrivalSequenceAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const eventIdEntry = formData.get("eventId");
  const redirectToEntry = formData.get("redirectTo");

  const redirectTo = typeof redirectToEntry === "string" ? redirectToEntry : "/admin/events";
  const eventId = typeof eventIdEntry === "string" ? eventIdEntry : null;

  if (!eventId) {
    redirect(redirectTo);
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    redirect(redirectTo);
  }

  const rsvps = await prisma.eventRsvp.findMany({
    where: { eventId, status: RsvpStatus.GOING },
    include: { user: true },
  });

  for (const rsvp of rsvps) {
    if (!rsvp.user?.email) continue;

    const mjml = eventArrivalSequenceTemplate({
      name: rsvp.user.name ?? "there",
      eventName: event.name,
      startAt: formatDate(event.startAt),
      venue: event.venue ?? event.venueName ?? "venue details forthcoming",
      notes: event.details ?? null,
    });

    const text = [
      `Hi ${rsvp.user.name ?? "there"},`,
      `You're confirmed for ${event.name}.`,
      `When: ${formatDate(event.startAt)} → ${formatDate(event.endAt)}`,
      event.venue ? `Where: ${event.venue}` : null,
      event.details ? `Notes: ${event.details}` : null,
      "Reply to this email if your plans change.",
    ]
      .filter(Boolean)
      .join("\n");

    await sendEmail({
      to: rsvp.user.email,
      subject: `${event.name}: your arrival game plan`,
      mjml,
      text,
      tags: [
        { name: "eventId", value: eventId },
        { name: "sequence", value: "arrival" },
      ],
    });
  }

  revalidatePath(`/admin/events/${eventId}/rsvps`);
  redirect(redirectTo);
}
