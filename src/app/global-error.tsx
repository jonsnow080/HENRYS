"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_COPY } from "@/lib/site-copy";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">500</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Unexpected error</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Something broke while loading this page. You can try again, or head back to the {SITE_COPY.name} homepage.
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
      </body>
    </html>
  );
}
