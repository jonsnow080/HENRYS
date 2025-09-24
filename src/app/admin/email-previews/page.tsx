import type { Metadata } from "next";
import { Role } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { SITE_COPY } from "@/lib/site-copy";
import { renderMjml } from "@/lib/email/mjml";
import {
  applicationConfirmationTemplate,
  inviteTemplate,
  magicLinkTemplate,
} from "@/lib/email/templates";

export const metadata: Metadata = {
  title: `Email previews · ${SITE_COPY.name}`,
  description: "Preview transactional MJML emails before sending.",
};

export default async function EmailPreviewsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const previews = [
    {
      key: "application",
      name: "Application confirmation",
      description: "Sent instantly after someone applies to HENRYS.",
      html: renderMjml(applicationConfirmationTemplate({ name: "Avery" })),
    },
    {
      key: "invite",
      name: "Membership invite",
      description: "Delivered when an application is approved.",
      html: renderMjml(
        inviteTemplate({
          name: "Avery Kim",
          magicLink: `${process.env.SITE_URL ?? "https://henrys.club"}/login?token=demo`,
          inviteCode: "HENRYS-DEMO",
        }),
      ),
    },
    {
      key: "magic-link",
      name: "Magic link",
      description: "Email magic link used for passwordless sign in.",
      html: renderMjml(
        magicLinkTemplate({
          url: `${process.env.SITE_URL ?? "https://henrys.club"}/api/auth/callback/email?token=demo`,
        }),
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Email previews</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Keep every touchpoint on-brand</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review MJML templates rendered as responsive HTML. These previews use mocked data and do not send emails.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {previews.map((preview) => (
          <section
            key={preview.key}
            className="flex flex-col gap-4 rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-sm"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{preview.name}</h2>
              <p className="text-sm text-muted-foreground">{preview.description}</p>
            </div>
            <iframe
              title={`${preview.name} preview`}
              srcDoc={preview.html}
              className="h-[520px] w-full rounded-2xl border border-border/60 bg-background"
              loading="lazy"
            />
          </section>
        ))}
      </div>
    </div>
  );
}
