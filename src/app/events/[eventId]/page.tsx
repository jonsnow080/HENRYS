import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RsvpStatus } from "@/lib/prisma-constants";
import { PurchaseTicketForm } from "./_components/purchase-ticket-form";
import { EventRsvpButton } from "./_components/event-rsvp-button";
import { getMatchSuggestions } from "@/lib/match-service";

export const metadata: Metadata = {
  title: "Event details",
};

export default async function EventDetailPage(props: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined> | undefined>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [event, subscription, rsvp] = await Promise.all([
    prisma.event.findUnique({ where: { id: params.eventId } }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { plan: true }
    }),
    prisma.eventRsvp.findFirst({
      where: { userId: session.user.id, eventId: params.eventId },
    })
  ]);

  if (!event || !event.visibility) {
    notFound();
  }

  const status = rsvp?.status ?? null;
  const priceLabel = event.priceCents > 0 ? formatCurrency(event.priceCents, event.currency) : "complimentary";
  const checkoutStatus = typeof searchParams?.checkout === "string" ? searchParams?.checkout : undefined;

  type MatchSuggestion = { id: string; suggestedUser: { name: string | null }; reason: string | null };
  let matchSuggestions: MatchSuggestion[] = [];
  if (status === RsvpStatus.GOING && subscription?.plan?.includesMatchmaking) {
    matchSuggestions = await getMatchSuggestions(session.user.id, event.id);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Upcoming salon</p>
        <h1 className="text-4xl font-semibold">{event.name}</h1>
        <div className="text-sm text-muted-foreground">
          <p>{formatDate(event.startAt)} → {formatDate(event.endAt)}</p>
          {event.venue && <p>{event.venue}</p>}
        </div>
      </div>
      <div className="prose max-w-none dark:prose-invert">
        <p className="text-base text-muted-foreground">{event.summary}</p>
        {event.details && <p className="whitespace-pre-line text-sm text-muted-foreground">{event.details}</p>}
      </div>

      {/* Status Messages */}
      {checkoutStatus === "success" && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100">
          You&apos;re confirmed for this salon. Check your inbox for the Stripe receipt and calendar hold.
        </div>
      )}
      {checkoutStatus === "cancelled" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          Ticket purchase was cancelled before payment. Your RSVP status hasn&apos;t changed.
        </div>
      )}
      {status === RsvpStatus.GOING && (
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm text-sky-900 dark:text-sky-100">
          You&apos;re marked as going. Reach out to the hosts if you need to release your seat.
        </div>
      )}
      {status === RsvpStatus.WAITLISTED && (
        <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 text-sm text-purple-900 dark:text-purple-100">
          You&apos;re currently on the waitlist. Purchasing a ticket will upgrade you to going.
        </div>
      )}

      {/* Match Suggestions for VIPs */}
      {matchSuggestions.length > 0 && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Handpicked Connections</h3>
          <p className="mb-4 text-sm text-muted-foreground">Based on your interests, we think you should meet:</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {matchSuggestions.map((match: MatchSuggestion) => (
              <div key={match.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div>
                  <p className="font-medium">{match.suggestedUser.name ?? "Member"}</p>
                  {match.reason && <p className="text-xs text-muted-foreground">{match.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Area */}
      {status !== RsvpStatus.GOING && (
        <div className="flex flex-col gap-4">
          {subscription ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Member Access</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Use your membership to reserve a spot at this salon.
                {subscription.plan.monthlyEventLimit ? ` (Limit: ${subscription.plan.monthlyEventLimit}/mo)` : " (Unlimited access)"}
              </p>
              <EventRsvpButton eventId={event.id} />
            </div>
          ) : event.priceCents > 0 ? (
            <PurchaseTicketForm
              eventId={event.id}
              priceLabel={priceLabel}
              disabled={false}
            />
          ) : (
            <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
              This salon is complimentary. <span className="font-medium text-foreground">Sign up for a membership</span> to RSVP online, or contact the host.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
