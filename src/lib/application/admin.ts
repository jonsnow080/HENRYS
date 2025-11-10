import type { PrismaClient } from "@prisma/client";

import { ApplicationStatus, Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import type { ApplicationFormInput } from "./schema";
import { generateInviteCode } from "@/lib/invite";
import { createMagicLink } from "@/lib/auth/magic-link";
import { sendEmail } from "@/lib/email/send";
import { inviteTemplate } from "@/lib/email/templates";
import { SITE_COPY } from "@/lib/site-copy";

type PrismaUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type PrismaInviteCode = {
  id: string;
  code: string;
};

type PrismaApplication = {
  id: string;
  email: string;
  fullName: string;
  status: ApplicationStatus;
  payload: unknown;
  notes?: string | null;
};

type ApprovalResult = {
  user: PrismaUser;
  invite: PrismaInviteCode | null;
  magicLinkUrl?: string;
};

export function readApplicationPayload(payload: unknown): ApplicationFormInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  try {
    return structuredClone(payload) as ApplicationFormInput;
  } catch (error) {
    console.error("Failed to parse application payload", error);
    return null;
  }
}

export async function approveApplication({
  application,
  reviewerId,
  notes,
}: {
  application: PrismaApplication;
  reviewerId: string;
  notes?: string;
}): Promise<ApprovalResult> {
  const payload = readApplicationPayload(application.payload);
  const now = new Date();

  const transactionalPrisma = prisma as unknown as PrismaClient;

  return transactionalPrisma.$transaction(async (tx) => {
    const client = tx as typeof prisma;

    let user = await client.user.findUnique({ where: { email: application.email } });

    if (!user) {
      user = await client.user.create({
        data: {
          email: application.email,
          name: application.fullName,
          role: Role.MEMBER,
        },
      });
    } else {
      const isPrivileged = user.role === Role.ADMIN || user.role === Role.HOST;
      const nextRole = isPrivileged ? user.role : Role.MEMBER;
      user = await client.user.update({
        where: { id: user.id },
        data: {
          role: nextRole,
          name: user.name ?? application.fullName,
        },
      });
    }

    if (payload) {
      const personalityTags = payload.threeWords
        ? payload.threeWords
            .split(/[,/]/)
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      await client.memberProfile.upsert({
        where: { userId: user.id },
        update: {
          fullName: application.fullName,
          age: payload.age ?? undefined,
          city: payload.city ?? undefined,
          occupation: payload.occupation ?? undefined,
          linkedinUrl: payload.linkedin || undefined,
          instagramUrl: payload.instagram || undefined,
          about: payload.motivation ?? undefined,
          threeWords: payload.threeWords ?? undefined,
          perfectSaturday: payload.perfectSaturday ?? undefined,
          dietaryPreferences: payload.dietary || undefined,
          dietaryNotes: payload.dietaryNotes || undefined,
          alcoholPreferences: payload.alcohol ?? undefined,
          vibeEnergy: payload.vibe ?? undefined,
          dealBreakers: payload.dealBreakers ?? [],
          personalityTags,
          availabilityWindows: payload.availability ? [payload.availability] : undefined,
        },
        create: {
          userId: user.id,
          fullName: application.fullName,
          age: payload.age ?? undefined,
          city: payload.city ?? undefined,
          occupation: payload.occupation ?? undefined,
          linkedinUrl: payload.linkedin || undefined,
          instagramUrl: payload.instagram || undefined,
          about: payload.motivation ?? undefined,
          threeWords: payload.threeWords ?? undefined,
          perfectSaturday: payload.perfectSaturday ?? undefined,
          dietaryPreferences: payload.dietary || undefined,
          dietaryNotes: payload.dietaryNotes || undefined,
          alcoholPreferences: payload.alcohol ?? undefined,
          vibeEnergy: payload.vibe ?? undefined,
          dealBreakers: payload.dealBreakers ?? [],
          personalityTags,
          availabilityWindows: payload.availability ? [payload.availability] : undefined,
        },
      });
    }

    const invite = await client.inviteCode.create({
      data: {
        code: generateInviteCode(application.email),
        applicationId: application.id,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });

    await client.application.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.APPROVED,
        reviewedAt: now,
        reviewerId,
        applicantId: user.id,
        ...(notes ? { notes } : {}),
      },
    });

    return { user, invite } satisfies ApprovalResult;
  });
}

export async function updateApplicationStatus({
  application,
  status,
  reviewerId,
  notes,
}: {
  application: PrismaApplication;
  status: ApplicationStatus;
  reviewerId: string;
  notes?: string;
}) {
  if (status === ApplicationStatus.APPROVED) {
    const { user, invite } = await approveApplication({ application, reviewerId, notes });

    const { url } = await createMagicLink({
      email: user.email,
      redirectTo: "/dashboard",
      sendEmailNotification: false,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: `Welcome to ${SITE_COPY.name}`,
        mjml: inviteTemplate({
          name: user.name ?? application.fullName,
          magicLink: url,
          inviteCode: invite?.code,
        }),
        text: `You're approved for ${SITE_COPY.name}. Use this link to sign in: ${url}`,
        tags: [{ name: "category", value: "invite" }],
      });
    } catch (error) {
      console.error("Failed to send invite email", error);
    }

    return;
  }

  const now = new Date();

  await prisma.application.update({
    where: { id: application.id },
    data: {
      status,
      reviewedAt: now,
      reviewerId,
      ...(notes ? { notes } : {}),
    },
  });
}
