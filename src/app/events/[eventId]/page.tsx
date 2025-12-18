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

      {/* Match Suggestions & Upsell */}
      {status === RsvpStatus.GOING && (
        <>
          {subscription?.plan?.includesMatchmaking ? (
            /* VIP VIEW: Real Matches */
            matchSuggestions.length > 0 && (
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Handpicked Connections</h3>
                <p className="mb-4 text-sm text-muted-foreground">Based on your interests, we think you should meet:</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {matchSuggestions.map((match: any) => (
                    <div key={match.id} className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
                      <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400" />
                      <div>
                        <p className="font-semibold text-foreground">{match.suggestedUser.name}</p>
                        {/* Show occupation if available, fallback to nothing */}
                        {match.suggestedUser.memberProfile?.occupation && (
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{match.suggestedUser.memberProfile.occupation}</p>
                        )}
                        {match.reason && <p className="mt-1 text-sm text-muted-foreground">{match.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* STANDARD VIEW: Upsell / Locked State */
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 filter blur-[2px] opacity-50 select-none" aria-hidden="true">
                <h3 className="text-lg font-semibold">Handpicked Connections</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-2 w-full">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 p-6 text-center backdrop-blur-[1px]">
                <div className="max-w-xs space-y-3">
                  <p className="text-sm font-medium text-foreground">Unlock 3 curated matches for this event.</p>
                  <p className="text-xs text-muted-foreground">Upgrade to VIP to get handpicked introductions based on your profile.</p>
                  <a
                    href="/dashboard/profile" // Eventually link to upgrade flow, using profile for now as placeholder or maybe offers
                    className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                  >
                    Upgrade Membership
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
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
