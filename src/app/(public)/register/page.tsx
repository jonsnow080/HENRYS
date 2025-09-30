import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { z } from "zod";
import { SITE_COPY } from "@/lib/site-copy";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: `Create account · ${SITE_COPY.name}`,
  description: "Create a password to access your HENRYS account and manage your membership.",
};

export default async function RegisterPage() {
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
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Choose a secure password that&apos;s at least eight characters long. You&apos;ll use these details to sign in next time.
        </p>
      </header>
      <RegisterForm initialEmail={initialEmail} />
      <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
        <p>
          Already have an account? {" "}
          <Link className="font-semibold text-foreground underline" href="/login">
            Sign in
          </Link>
          .
        </p>
        <p>
          Need to reset your password? {" "}
          <Link className="font-semibold text-foreground underline" href="/reset-password">
            Do that here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
