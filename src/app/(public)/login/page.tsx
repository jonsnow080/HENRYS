import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { z } from "zod";
import { SITE_COPY } from "@/lib/site-copy";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: `Member login · ${SITE_COPY.name}`,
  description: "Sign in with a magic link or your password to access your HENRYS dashboard and events.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; callbackUrl?: string };
}) {
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

  const redirectTo = searchParams?.redirectTo ?? searchParams?.callbackUrl;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-3 text-left">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Choose whether to receive a one-time magic link or enter your password. Magic links expire in 15 minutes and
          work on any device.
        </p>
      </header>
      <SignInForm redirectTo={redirectTo} initialEmail={initialEmail} />
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
        <p>
          New here?{" "}
          <Link className="font-semibold text-foreground underline" href="/register">
            Create an account
          </Link>
          .
        </p>
        <p>
          Need a hand?{" "}
          <Link className="font-semibold text-foreground underline" href="/reset-password">
            Reset your password
          </Link>
          .
        </p>
        <p>
          Not a member yet?{" "}
          <Link className="font-semibold text-foreground underline" href="/apply">
            Apply now
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
