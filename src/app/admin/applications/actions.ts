"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus, Role } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicationStatus } from "@/lib/application/admin";
import { recordAuditLog } from "@/lib/audit-log";
import { SITE_COPY } from "@/lib/site-copy";
import { inviteTemplate } from "@/lib/email/templates";
import { createMagicLink } from "@/lib/auth/magic-link";
import { sendEmail } from "@/lib/email/send";

const BASE_URL = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

const DECISION_STATUSES = [
  ApplicationStatus.APPROVED,
  ApplicationStatus.WAITLIST,
  ApplicationStatus.REJECTED,
] as const;

type DecisionStatus = (typeof DECISION_STATUSES)[number];

type ActionState = {
  status?: "success" | "error";
  message?: string;
};

type ApplicationRecord = {
  id: string;
  email: string;
  fullName: string;
  status: ApplicationStatus;
  notes: string | null;
};

function parseStatus(value: FormDataEntryValue | null): ApplicationStatus | null {
  if (!value || typeof value !== "string") return null;
  const match = Object.values(ApplicationStatus).find((status) => status === value);
  return match ?? null;
}

function buildBasicDecisionEmail({
  name,
  subject,
  paragraphs,
}: {
  name: string;
  subject: string;
  paragraphs: string[];
}): { subject: string; mjml: string; text: string } {
  const greeting = `Hi ${name},`;
  const bodyParagraphs = [greeting, ...paragraphs, `— The ${SITE_COPY.name} team`];
  const text = bodyParagraphs.join("\n\n");
  const paragraphMarkup = bodyParagraphs
    .map(
      (paragraph) =>
        `<mj-text font-size="16px" line-height="1.6" color="#1f1f1f" padding="0 0 16px 0">${paragraph}</mj-text>`,
    )
    .join("");

  const mjml = `
    <mjml>
      <mj-body background-color="#f7f7f8">
        <mj-section padding="32px 16px">
          <mj-column background-color="#ffffff" padding="24px" border-radius="20px">
            <mj-text font-size="18px" font-weight="600" color="#111111" padding="0 0 16px 0">
              ${subject}
            </mj-text>
            ${paragraphMarkup}
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  return { subject, mjml, text };
}

export async function buildApplicationEmailPayload({
  application,
  template,
  includeMagicLink = false,
}: {
  application: ApplicationRecord;
  template: DecisionStatus;
  includeMagicLink?: boolean;
}): Promise<{ subject: string; mjml: string; text: string }> {
  const firstName = application.fullName.split(" ")[0] ?? application.fullName;

  if (template === ApplicationStatus.APPROVED) {
    let magicLinkUrl = `${BASE_URL}/login`;
    if (includeMagicLink) {
      const { url } = await createMagicLink({
        email: application.email,
        redirectTo: "/dashboard",
        sendEmailNotification: false,
      });
      magicLinkUrl = url;
    }

    const mjml = inviteTemplate({
      name: application.fullName,
      magicLink: magicLinkUrl,
      inviteCode: undefined,
    });

    const text = [
      `Hi ${firstName},`,
      `You're officially approved for ${SITE_COPY.name}!`,
      `Use this magic link to sign in and confirm your membership: ${magicLinkUrl}`,
      `— The ${SITE_COPY.name} team`,
    ].join("\n\n");

    return {
      subject: `Welcome to ${SITE_COPY.name}`,
      mjml,
      text,
    };
  }

  if (template === ApplicationStatus.WAITLIST) {
    return buildBasicDecisionEmail({
      name: firstName,
      subject: `You're on the waitlist for ${SITE_COPY.name}`,
      paragraphs: [
        `Thank you so much for applying to ${SITE_COPY.name}. We loved learning more about you.`,
        "We're currently at capacity for the next salons, so we've added you to our waitlist.",
        "As soon as a spot opens up, we'll reach out with an invitation to join us.",
      ],
    });
  }

  return buildBasicDecisionEmail({
    name: firstName,
    subject: `Thank you for applying to ${SITE_COPY.name}`,
    paragraphs: [
      `We truly appreciate you taking the time to apply to ${SITE_COPY.name}.`,
      "After careful consideration, we won't be able to extend an invitation right now.",
      "We hope you'll stay connected—our doors may open for future experiences that are a better fit.",
    ],
  });
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

    const auditDiffs: {
      applicationId: string;
      previousStatus: ApplicationStatus;
      nextStatus: ApplicationStatus;
      previousNotes: string | null;
      nextNotes: string | null;
    }[] = [];

    for (const application of applications) {
      await updateApplicationStatus({
        application,
        status: nextStatus,
        reviewerId: session.user.id,
        notes: shouldApplyNotes ? notes : undefined,
      });
      auditDiffs.push({
        applicationId: application.id,
        previousStatus: application.status,
        nextStatus,
        previousNotes: application.notes ?? null,
        nextNotes: shouldApplyNotes ? notes : application.notes ?? null,
      });
    }

    revalidatePath("/admin/applications");

    await recordAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email ?? null,
      action: "applications.bulkUpdate",
      targetType: "application",
      targetId: auditDiffs.length === 1 ? auditDiffs[0]!.applicationId : "bulk",
      diff: {
        updates: auditDiffs,
      },
    });

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

export type ApplicationNotesState = ActionState;

export async function updateApplicationNotes(
  _prevState: ApplicationNotesState,
  formData: FormData,
): Promise<ApplicationNotesState> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { status: "error", message: "You must be an admin." };
  }

  const applicationId = formData.get("applicationId");
  if (!applicationId || typeof applicationId !== "string") {
    return { status: "error", message: "Missing application." };
  }

  const noteValue = formData.get("notes");
  const notes = typeof noteValue === "string" ? noteValue.trim() : "";

  try {
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      return { status: "error", message: "Application not found." };
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        notes: notes.length ? notes : null,
        reviewerId: session.user.id,
        reviewedAt: application.reviewedAt ?? new Date(),
      },
    });

    await recordAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email ?? null,
      action: "application.notes",
      targetType: "application",
      targetId: application.id,
      diff: {
        previousNotes: application.notes ?? "",
        nextNotes: notes,
      },
    });

    revalidatePath("/admin/applications");

    return { status: "success", message: "Notes saved." };
  } catch (error) {
    console.error("Failed to update application notes", error);
    return { status: "error", message: "Unable to save notes right now." };
  }
}

export type ApplicationEmailState = ActionState;

export async function sendApplicationDecisionEmail(
  _prevState: ApplicationEmailState,
  formData: FormData,
): Promise<ApplicationEmailState> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { status: "error", message: "You must be an admin." };
  }

  const applicationId = formData.get("applicationId");
  const templateRaw = formData.get("template");

  if (!applicationId || typeof applicationId !== "string") {
    return { status: "error", message: "Missing application." };
  }

  const parsedStatus = parseStatus(templateRaw);
  if (!parsedStatus || !DECISION_STATUSES.includes(parsedStatus as DecisionStatus)) {
    return { status: "error", message: "Choose a valid template." };
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      return { status: "error", message: "Application not found." };
    }

    const payload = await buildApplicationEmailPayload({
      application: {
        id: application.id,
        email: application.email,
        fullName: application.fullName,
        status: application.status,
        notes: application.notes ?? null,
      },
      template: parsedStatus as DecisionStatus,
      includeMagicLink: parsedStatus === ApplicationStatus.APPROVED,
    });

    await sendEmail({
      to: application.email,
      subject: payload.subject,
      mjml: payload.mjml,
      text: payload.text,
      tags: [
        { name: "category", value: "application" },
        { name: "template", value: parsedStatus.toLowerCase() },
      ],
    });

    await recordAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email ?? null,
      action: "application.email",
      targetType: "application",
      targetId: application.id,
      diff: {
        template: parsedStatus,
        subject: payload.subject,
      },
    });

    return {
      status: "success",
      message: `Email sent to ${application.email}.`,
    };
  } catch (error) {
    console.error("Failed to send application email", error);
    return {
      status: "error",
      message: "Unable to send email. Try again soon.",
    };
  }
}

export type DecisionTemplateOption = DecisionStatus;
