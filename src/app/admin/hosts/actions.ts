"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email/send";
import { HostInvitationTemplate } from "@/lib/email/templates";

export async function addHostAction(formData: FormData) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login?redirectTo=/admin/hosts");
    }

    if (session.user.role !== Role.ADMIN) {
        redirect("/dashboard");
    }

    const email = formData.get("email");
    if (!email || typeof email !== "string") {
        return { error: "Email is required" };
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Invite new host
        const invite = await prisma.inviteCode.create({
            data: {
                code: crypto.randomUUID(),
                createdById: session.user.id,
                role: Role.HOST,
                email, // Persist email
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        await sendEmail({
            to: email,
            subject: "You're invited to be a host on HENRYS",
            mjml: HostInvitationTemplate({
                inviteCode: invite.code,
            }),
        });

        return { success: true, message: "Invitation sent" };
    }

    if (user.role === Role.HOST || user.role === Role.ADMIN) {
        return { error: "User is already a host or admin" };
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.HOST },
    });

    await recordAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email ?? null,
        action: "hosts.add",
        targetType: "user",
        targetId: user.id,
        diff: {
            previousRole: user.role,
            nextRole: Role.HOST,
        },
    });

    revalidatePath("/admin/hosts");
    return { success: true };
}

export async function removeHostAction(formData: FormData) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login?redirectTo=/admin/hosts");
    }

    if (session.user.role !== Role.ADMIN) {
        redirect("/dashboard");
    }

    const userId = formData.get("userId");
    if (!userId || typeof userId !== "string") {
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { memberProfile: true },
    });

    if (!user) {
        return;
    }

    // Determine fallback role
    const nextRole = user.memberProfile ? Role.MEMBER : Role.GUEST;

    await prisma.user.update({
        where: { id: user.id },
        data: { role: nextRole },
    });

    await recordAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email ?? null,
        action: "hosts.remove",
        targetType: "user",
        targetId: user.id,
        diff: {
            previousRole: user.role,
            nextRole: nextRole,
        },
    });

    revalidatePath("/admin/hosts");
}

export async function resendHostInviteAction(prevState: any, formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.ADMIN) {
        return { error: "Unauthorized" };
    }

    const inviteId = formData.get("inviteId");
    if (!inviteId || typeof inviteId !== "string") {
        return { error: "Missing invite ID" };
    }

    const invite = await prisma.inviteCode.findUnique({
        where: { id: inviteId },
    });

    if (!invite || !invite.email) {
        return { error: "Invite not found or missing email" };
    }

    try {
        await sendEmail({
            to: invite.email,
            subject: "Reminder: You're invited to be a host on HENRYS",
            mjml: HostInvitationTemplate({
                inviteCode: invite.code,
            }),
        });
        return { success: true, message: "Invitation resent" };
    } catch (error) {
        console.error("Failed to resend invite:", error);
        return { error: "Failed to send email" };
    }
}
