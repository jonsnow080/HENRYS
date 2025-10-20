"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus, Role } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicationStatus } from "@/lib/application/admin";
import { recordAuditLog } from "@/lib/audit-log";

export async function approveApplicationAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?redirectTo=/admin");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const applicationId = formData.get("applicationId");
  if (!applicationId || typeof applicationId !== "string") {
    return;
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application || application.status === ApplicationStatus.APPROVED) {
    return;
  }

  await updateApplicationStatus({
    application,
    status: ApplicationStatus.APPROVED,
    reviewerId: session.user.id,
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email ?? null,
    action: "applications.quickApprove",
    targetType: "application",
    targetId: application.id,
    diff: {
      previousStatus: application.status,
      nextStatus: ApplicationStatus.APPROVED,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
}
