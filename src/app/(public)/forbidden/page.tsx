import type { Metadata } from "next";
import Link from "next/link";

import { SITE_COPY } from "@/lib/site-copy";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Access denied · ${SITE_COPY.name}`,
  description:
    "You do not have permission to view this area. Return to the home page or get in touch with the HENRYS team for help.",
};

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">403</p>
      <h1 className="text-4xl font-semibold sm:text-5xl">Access denied</h1>
      <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
        You’re signed in, but your account doesn’t have access to the admin console. If you believe this is a mistake, head
        back to the home page or drop us a note and we’ll help you out.
      </p>
      <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
        <Button asChild size="lg" className="rounded-full px-6">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="rounded-full px-6">
          <Link href="mailto:team@henrys.club">Contact support</Link>
        </Button>
      </nav>
    </main>
  );
}
