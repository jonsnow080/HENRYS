import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { z } from "zod";
import { SITE_COPY } from "@/lib/site-copy";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: `Reset password · ${SITE_COPY.name}`,
  description: "Reset your password using your email address to regain access to your HENRYS account.",
};

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const remembered = cookieStore.get("henrys-last-login")?.value ?? "";
  let initialEmail = "";

  if (remembered) {
    try {
      const decoded = Buffer.from(remembered, "base64url").toString("utf8");
      if (z.string().email().safeParse(decoded).success) {
        initialEmail = decoded;
      }
    } catch (error) {
      console.warn("Failed to decode remembered email", error);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-3 text-left">
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address twice along with a new password. If the email matches an account we&apos;ll update the
          password immediately.
        </p>
      </header>
      <ResetPasswordForm initialEmail={initialEmail} />
      <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
        <p>
          Remembered your password? {" "}
          <Link className="font-semibold text-foreground underline" href="/login">
            Go back to sign in
          </Link>
          .
        </p>
        <p>
          Need to create an account instead? {" "}
          <Link className="font-semibold text-foreground underline" href="/register">
            Register here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
