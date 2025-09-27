"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit-log";

export type CreateEventState = {
  status?: "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  eventId?: string;
};

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (!value || typeof value !== "string") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (!value || typeof value !== "string") return false;
  return value === "true" || value === "1" || value === "on";
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function generateUniqueSlug(base: string) {
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "event";

  let slug = cleaned;
  let counter = 1;
  // Ensure uniqueness by checking existing events.
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${cleaned}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function createEventAction(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { status: "error", message: "You must be an admin to create events." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();
  const venueAddress = String(formData.get("venueAddress") ?? "").trim();
  const venueNotes = String(formData.get("venueNotes") ?? "").trim();
  const startAt = parseDate(formData.get("startAt"));
  const endAt = parseDate(formData.get("endAt"));
  const rsvpDeadline = parseDate(formData.get("rsvpDeadline"));
  const venueHiddenUntil = parseDate(formData.get("venueHiddenUntil"));
  const capacity = parseNumber(formData.get("capacity")) ?? 40;
  const priceInput = String(formData.get("price") ?? "0").trim();
  const visibility = parseBoolean(formData.get("visibility"));

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Give the event a title.";
  if (!summary) errors.summary = "Add a short summary.";
  if (!startAt) errors.startAt = "Choose a start time.";
  if (!endAt) errors.endAt = "Choose an end time.";
  if (startAt && endAt && endAt <= startAt) errors.endAt = "End time must be after the start.";
  if (capacity <= 0) errors.capacity = "Capacity must be greater than zero.";

  const priceNumber = Number.parseFloat(priceInput.replace(/[^0-9.]/g, ""));
  const priceCents = Number.isFinite(priceNumber) ? Math.round(priceNumber * 100) : 0;
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    errors.price = "Enter a valid price.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors,
    };
  }

  const slug = await generateUniqueSlug(title);

  const event = await prisma.event.create({
    data: {
      slug,
      name: title,
      summary,
      startAt: startAt!,
      endAt: endAt!,
      capacity,
      details: details || null,
      priceCents,
      currency: "usd",
      visibility,
      venue: venueName || null,
      venueName: venueName || null,
      venueAddress: venueAddress || null,
      venueNotes: venueNotes || null,
      venueHiddenUntil,
      rsvpDeadline,
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email ?? null,
    action: "event.create",
    targetType: "event",
    targetId: event.id,
    diff: {
      name: event.name,
      startAt: event.startAt,
      capacity: event.capacity,
    },
  });

  revalidatePath("/admin/events");

  return {
    status: "success",
    message: "Event created.",
    eventId: event.id,
  };
}
