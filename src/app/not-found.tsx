import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_COPY } from "@/lib/site-copy";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">404</p>
      <h1 className="text-4xl font-semibold sm:text-5xl">Page not found</h1>
      <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
        We couldn’t find the page you were looking for. Double-check the URL or use the button below to head back to the {" "}
        {SITE_COPY.name} homepage.
      </p>
      <Button asChild size="lg" className="rounded-full px-6">
        <Link href="/" aria-label="Return to the public home page">
          Return to homepage
        </Link>
      </Button>
    </main>
  );
}
