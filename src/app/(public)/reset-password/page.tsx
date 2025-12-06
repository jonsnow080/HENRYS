import type { Metadata } from "next";
import Link from "next/link";
import { SITE_COPY } from "@/lib/site-copy";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: `Reset password · ${SITE_COPY.name}`,
  description: "Reset your password using your email address to regain access to your HENRYS account.",
};

import { prisma } from "@/lib/prisma";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  if (!token) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
          <h3 className="mb-2 text-lg font-semibold">Invalid Link</h3>
          <p>This password reset link is missing a token.</p>
          <Link href="/forgot-password" className="mt-4 inline-block underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
          <h3 className="mb-2 text-lg font-semibold">Link Expired</h3>
          <p>This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="mt-4 inline-block underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-3 text-left">
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </header>
      <ResetPasswordForm token={token} />
      <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
        <p>
          Remembered your password?{" "}
          <Link className="font-semibold text-foreground underline" href="/login">
            Go back to sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
