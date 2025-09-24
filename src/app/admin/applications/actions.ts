"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus, Role } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicationStatus } from "@/lib/application/admin";

const BASE_URL = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function parseStatus(value: FormDataEntryValue | null): ApplicationStatus | null {
  if (!value || typeof value !== "string") return null;
  const match = Object.values(ApplicationStatus).find((status) => status === value);
  return match ?? null;
}

export async function bulkUpdateApplications(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/login?callbackUrl=/admin/applications");
  }

  const redirectTarget = typeof formData.get("redirectTo") === "string" && formData.get("redirectTo")
    ? String(formData.get("redirectTo"))
    : "/admin/applications";

  const redirectUrl = new URL(redirectTarget, BASE_URL);
  for (const key of ["success", "error", "updated", "statusChange", "reason"]) {
    redirectUrl.searchParams.delete(key);
  }

  const ids = formData
    .getAll("applicationId")
    .map((value) => String(value))
    .filter(Boolean);

  if (!ids.length) {
    redirectUrl.searchParams.set("error", "no-selection");
    redirectUrl.searchParams.set("reason", "Select at least one application to update.");
    redirect(redirectUrl.pathname + redirectUrl.search);
  }

  const nextStatus = parseStatus(formData.get("nextStatus"));
  if (!nextStatus) {
    redirectUrl.searchParams.set("error", "invalid-status");
    redirectUrl.searchParams.set("reason", "Choose a valid status before updating.");
    redirect(redirectUrl.pathname + redirectUrl.search);
  }

  const noteValue = formData.get("notes");
  const notes = typeof noteValue === "string" ? noteValue.trim() : "";
  const shouldApplyNotes = notes.length > 0;

  try {
    const applications = await prisma.application.findMany({
      where: { id: { in: ids } },
    });

    if (!applications.length) {
      redirectUrl.searchParams.set("error", "not-found");
      redirectUrl.searchParams.set("reason", "No applications matched your selection.");
      redirect(redirectUrl.pathname + redirectUrl.search);
    }

    for (const application of applications) {
      await updateApplicationStatus({
        application,
        status: nextStatus,
        reviewerId: session.user.id,
        notes: shouldApplyNotes ? notes : undefined,
      });
    }

    revalidatePath("/admin/applications");

    redirectUrl.searchParams.set("success", "1");
    redirectUrl.searchParams.set("updated", String(applications.length));
    redirectUrl.searchParams.set("statusChange", nextStatus);
    redirect(redirectUrl.pathname + redirectUrl.search);
  } catch (error) {
    console.error("Failed to update applications", error);
    redirectUrl.searchParams.set("error", "server-error");
    redirectUrl.searchParams.set(
      "reason",
      "Something went wrong while updating applications. Please try again.",
    );
    redirect(redirectUrl.pathname + redirectUrl.search);
  }
}
