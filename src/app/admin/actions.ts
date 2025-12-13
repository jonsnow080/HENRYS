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

export async function getMemberGrowth() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const users = await prisma.user.findMany({
    where: {
      role: { in: [Role.MEMBER, Role.HOST] },
      createdAt: { gte: sixMonthsAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData = users.reduce((acc, user) => {
    const month = user.createdAt.toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
}

export async function getApprovalRates() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const applications = await prisma.application.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { status: true, createdAt: true },
  });

  const monthlyStats = applications.reduce((acc, app) => {
    const month = app.createdAt.toLocaleString("default", { month: "short" });
    if (!acc[month]) acc[month] = { total: 0, approved: 0 };

    acc[month].total++;
    if (app.status === ApplicationStatus.APPROVED) {
      acc[month].approved++;
    }
    return acc;
  }, {} as Record<string, { total: number; approved: number }>);

  return Object.entries(monthlyStats).map(([name, stats]) => ({
    name,
    rate: Math.round((stats.approved / stats.total) * 100),
  }));
}

export async function getRevenue() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const payments = await prisma.payment.findMany({
    where: {
      status: "succeeded",
      createdAt: { gte: sixMonthsAgo },
    },
    select: { amount: true, createdAt: true },
  });

  const monthlyRevenue = payments.reduce((acc, payment) => {
    const month = payment.createdAt.toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyRevenue).map(([name, value]) => ({
    name,
    value: value / 100,
  }));
}
