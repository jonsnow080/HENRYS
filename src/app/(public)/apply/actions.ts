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
  const dealBreakers = Array.from(
    new Set<string>(
      formData
        .getAll("dealBreakers")
        .filter((entry): entry is string => typeof entry === "string" && entry.length > 0),
    ),
  );

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

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const payload = { ...parsed.data, email: normalizedEmail };

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    if (existingUser) {
      return {
        success: false,
        message: "It looks like you already have an account with this email.",
        fieldErrors: {
          email: [
            "Already have an account? Head to the login page to request a new magic link.",
          ],
          form: ["Visit the login page to sign in or request a fresh magic link."],
        },
      };
    }
  } catch (error) {
    console.error("Failed to check for existing account", error);
    return {
      success: false,
      message: "We couldn't verify your account status. Please try again shortly.",
    };
  }

  try {
    const existing = await prisma.application.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.WAITLIST] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.application.update({
        where: { id: existing.id },
        data: {
          email: normalizedEmail,
          fullName: payload.fullName,
          payload,
          createdAt: new Date(),
          status: ApplicationStatus.SUBMITTED,
        },
      });
    } else {
      await prisma.application.create({
        data: {
          email: normalizedEmail,
          fullName: payload.fullName,
          payload,
          status: ApplicationStatus.SUBMITTED,
        },
      });
    }
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

  redirect(`/apply/success?email=${encodeURIComponent(payload.email)}`);
}

