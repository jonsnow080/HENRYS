import type { Metadata } from "next";
import Link from "next/link";
import { SITE_COPY } from "@/lib/site-copy";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: `Apply · ${SITE_COPY.name}`,
  description: "Submit your application to join HENRYS, the invite-only IRL dating club for London's most curious people.",
};

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-4 text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Apply</p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Let&apos;s get to know you.</h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          We review applications weekly. Expect a personal reply from the founders within seven days. Already a member?
          <Link href="/login" className="ml-2 underline">
            Request a magic link.
          </Link>
        </p>
      </header>
      <div className="mt-10 rounded-[36px] border border-border/70 bg-card/80 p-6 sm:p-10">
        <ApplyForm />
      </div>
    </div>
  );
}
