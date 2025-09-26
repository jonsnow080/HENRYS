import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Events",
};

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const events = await prisma.event.findMany({ where: { visibility: true } });
  const sorted = events.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Upcoming salons</h1>
        <p className="text-sm text-muted-foreground">
          Choose your next slow dating adventure. Tickets and memberships do not include food or drink—expect curated options
          available on the night.
        </p>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
          New salons drop every fortnight. Check back soon.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sorted.map((event) => {
            const priceLabel =
              event.priceCents > 0
                ? formatCurrency(event.priceCents, event.currency)
                : "Complimentary";
            return (
              <div key={event.id} className="flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{formatDate(event.startAt)}</div>
                  <h2 className="text-2xl font-semibold">{event.name}</h2>
                  <p className="text-sm text-muted-foreground">{event.summary}</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{priceLabel}</span>
                  <Button asChild>
                    <Link href={`/events/${event.id}`}>View details</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
