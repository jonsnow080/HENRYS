"use server";

import { redirect } from "next/navigation";
import { ApplicationStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/application/schema";
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

  const payload = parsed.data;

  try {
    const existing = await prisma.application.findFirst({
      where: {
        email: { equals: payload.email, mode: "insensitive" },
        status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.WAITLIST] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return {
        success: false,
        message: "It looks like you've already applied with this email.",
        fieldErrors: {
          email: ["This Gmail address has already been used for an application."],
        },
      };
    }

    await prisma.application.create({
      data: {
        email: payload.email,
        fullName: payload.fullName,
        payload,
        status: ApplicationStatus.SUBMITTED,
      },
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
      to: payload.email,
      subject: `${SITE_COPY.name} application received`,
      mjml: applicationConfirmationTemplate({ name: payload.fullName }),
      text: `Thanks for applying to ${SITE_COPY.name}. We'll be in touch soon.`,
      tags: [{ name: "category", value: "application" }],
    });
  } catch (error) {
    console.error("Error sending confirmation email", error);
  }

  const params = new URLSearchParams({
    email: payload.email,
    fullName: payload.fullName,
  });

  redirect(`/apply/success?${params.toString()}`);
}

