import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { z } from "zod";
import { SITE_COPY } from "@/lib/site-copy";
import { MagicLinkForm } from "./magic-link-form";

export const metadata: Metadata = {
  title: `Member login · ${SITE_COPY.name}`,
  description: "Request a passwordless magic link to access your HENRYS dashboard and events.",
};

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const cookieStore = cookies() as unknown as {
    get: (name: string) => { value?: string } | undefined;
  };
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
        <h1 className="text-3xl font-semibold">Sign in with magic link</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a one-click link that expires in 15 minutes. Add founders@henrys.club to your contacts to avoid the spam
          folder.
        </p>
      </header>
      <MagicLinkForm callbackUrl={searchParams.callbackUrl} initialEmail={initialEmail} />
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
        Not a member yet? <Link className="font-semibold text-foreground underline" href="/apply">Apply now</Link>.
      </div>
    </div>
  );
}
