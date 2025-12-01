"use server";

import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { applicationSchema } from "@/lib/application/schema";
import { isCommonEmailDomain } from "@/lib/application/common-email-domains";
import { ApplicationStatus, Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { applicationConfirmationTemplate } from "@/lib/email/templates";
import { SITE_COPY } from "@/lib/site-copy";

export type ApplicationFormState = {
  message?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function submitApplicationAction(
  _: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const data = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
  const dealBreakers = formData.getAll("dealBreakers") as string[];

  const parsed = applicationSchema.safeParse({
    ...data,
    dealBreakers,
  });

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    const combinedErrors: Record<string, string[]> = {};
    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length) {
        combinedErrors[key] = messages;
      }
    }
    if (formErrors.length) {
      combinedErrors.form = formErrors;
    }
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: combinedErrors,
    };
  }

  const parsedData = parsed.data;
  const normalizedEmail = parsedData.email.toLowerCase();
  const payload = {
    ...parsedData,
    email: normalizedEmail,
  };

  try {
    const emailDomainIsTrusted = isCommonEmailDomain(payload.email);

    if (!emailDomainIsTrusted) {
      return {
        success: false,
        message: "Use a personal email from a well-known provider.",
        fieldErrors: {
          email: [
            "This email provider doesn't look familiar. Please use something like Gmail, Outlook, or iCloud.",
          ],
        },
      };
    }

    const existing = await prisma.application.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.WAITLIST] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return {
        success: false,
        message: "It looks like you've already applied with this email.",
        fieldErrors: {
          email: ["This email address has already been used for an application."],
        },
      };
    }

    const existingMember = await prisma.user.findFirst({
      where: {
        email: { equals: payload.email, mode: "insensitive" },
        role: { in: [Role.MEMBER, Role.HOST, Role.ADMIN] },
      },
    });

    if (existingMember) {
      return {
        success: false,
        message: "It looks like you're already a member.",
        fieldErrors: {
          email: ["This email address already belongs to a member."],
        },
      };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: payload.fullName,
            role: Role.APPLICANT,
          },
        });
      } else if (user.role === Role.GUEST) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { role: Role.APPLICANT },
        });
      }

      await tx.application.create({
        data: {
          email: payload.email,
          fullName: payload.fullName,
          payload,
          status: ApplicationStatus.SUBMITTED,
          applicantId: user.id,
        },
      });

      await tx.applicant.upsert({
        where: { email: payload.email },
        create: {
          userId: user.id,
          email: payload.email,
          fullName: payload.fullName,
          age: payload.age,
          city: payload.city,
          occupation: payload.occupation,
          linkedin: payload.linkedin,
          instagram: payload.instagram,
          vibe: payload.vibe,
          motivation: payload.motivation,
          threeWords: payload.threeWords,
          perfectSaturday: payload.perfectSaturday,
          dietary: payload.dietary,
          dietaryNotes: payload.dietaryNotes,
          alcohol: payload.alcohol,
          availability: payload.availability,
          dealBreakers: payload.dealBreakers,
          consentCode: payload.consentCode,
          consentData: payload.consentData,
        },
        update: {
          userId: user.id,
          fullName: payload.fullName,
          age: payload.age,
          city: payload.city,
          occupation: payload.occupation,
          linkedin: payload.linkedin,
          instagram: payload.instagram,
          vibe: payload.vibe,
          motivation: payload.motivation,
          threeWords: payload.threeWords,
          perfectSaturday: payload.perfectSaturday,
          dietary: payload.dietary,
          dietaryNotes: payload.dietaryNotes,
          alcohol: payload.alcohol,
          availability: payload.availability,
          dealBreakers: payload.dealBreakers,
          consentCode: payload.consentCode,
          consentData: payload.consentData,
        },
      });
    });
  } catch (error) {
    console.error("Failed to persist application", error);
    return {
      success: false,
      message: "We couldn't save your application. Please try again in a few minutes.",
    };
  }

  try {
    await sendEmail({
      to: parsedData.email,
      subject: `${SITE_COPY.name} application received`,
      mjml: applicationConfirmationTemplate({ name: payload.fullName }),
      text: `Thanks for applying to ${SITE_COPY.name}. We'll be in touch soon.`,
      tags: [{ name: "category", value: "application" }],
    });
  } catch (error) {
    console.error("Error sending confirmation email", error);
  }

  redirect(`/apply/success?email=${encodeURIComponent(parsedData.email)}`);
}

