"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_COPY } from "@/lib/site-copy";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">500</p>
      <h1 className="text-4xl font-semibold sm:text-5xl">Something went wrong</h1>
      <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
        We weren’t able to load this page because of an unexpected error. Try refreshing the page, or head back to the
        {" "}
        {SITE_COPY.name} homepage.
      </p>
      <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
        <Button type="button" size="lg" className="rounded-full px-6" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="secondary" size="lg" className="rounded-full px-6">
          <Link href="/" aria-label="Return to the public home page">
            Return to homepage
          </Link>
        </Button>
      </nav>
    </main>
  );
}
