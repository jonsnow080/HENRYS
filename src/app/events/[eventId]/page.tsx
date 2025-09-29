import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  calculateRefundQuote,
  describeRefundQuote,
  getCancellationDeadline,
} from "@/lib/events/policies";
import { RsvpStatus } from "@/lib/prisma-constants";
import { PurchaseTicketForm } from "./_components/purchase-ticket-form";
import { CancelRsvpDialog } from "./_components/cancel-rsvp-dialog";

export const metadata: Metadata = {
  title: "Event details",
};

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event || !event.visibility) {
    notFound();
  }

  const rsvp = await prisma.eventRsvp.findFirst({
    where: { userId: session.user.id, eventId: event.id },
  });

  const status = rsvp?.status ?? null;
  let cancellationProps: {
    refundMessage: string;
    refundAmountLabel: string | null;
    waitlistNote: string;
  } | null = null;

  if (status === RsvpStatus.GOING) {
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id, eventId: event.id },
      orderBy: { createdAt: "desc" },
    });
    const payment = payments[0] ?? null;
    const now = new Date();
    const refundQuote = calculateRefundQuote({
      event,
      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            refundedAmount: payment.refundedAmount ?? 0,
          }
        : null,
      now,
    });
    const refundAmountLabel =
      refundQuote.amountCents > 0 ? formatCurrency(refundQuote.amountCents, event.currency) : null;
    const deadline = getCancellationDeadline(event);
    const waitlistNote = now <= deadline
      ? `Cancelling before ${formatDate(deadline)} automatically offers your seat to the next waitlisted member.`
      : `The RSVP deadline (${formatDate(deadline)}) has passed—reach out to the hosts so we can fill the seat manually.`;
    cancellationProps = {
      refundMessage: describeRefundQuote(refundQuote),
      refundAmountLabel,
      waitlistNote,
    };
  }
  const priceLabel = event.priceCents > 0 ? formatCurrency(event.priceCents, event.currency) : "complimentary";
  const checkoutStatus = typeof searchParams?.checkout === "string" ? searchParams?.checkout : undefined;

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
      {status === RsvpStatus.GOING && cancellationProps && (
        <div className="flex flex-col gap-4 rounded-xl border border-sky-500/40 bg-sky-500/10 p-5 text-sky-900 shadow-sm dark:text-sky-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm">
            <p className="font-medium">You&apos;re confirmed for this salon.</p>
            <p className="text-sky-900/80 dark:text-sky-100/80">{cancellationProps.refundMessage}</p>
            <p className="text-xs uppercase tracking-wide text-sky-900/60 dark:text-sky-100/60">{cancellationProps.waitlistNote}</p>
          </div>
          <CancelRsvpDialog
            eventId={event.id}
            refundMessage={cancellationProps.refundMessage}
            refundAmountLabel={cancellationProps.refundAmountLabel}
            waitlistNote={cancellationProps.waitlistNote}
          />
        </div>
      )}
      {status === RsvpStatus.WAITLISTED && (
        <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 text-sm text-purple-900 dark:text-purple-100">
          You&apos;re currently on the waitlist. Purchasing a ticket will upgrade you to going.
        </div>
      )}
      {event.priceCents > 0 ? (
        <PurchaseTicketForm
          eventId={event.id}
          priceLabel={priceLabel}
          disabled={status === RsvpStatus.GOING}
        />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
          This salon is complimentary for members. RSVP directly with the hosts to confirm your spot.
        </div>
      )}
    </div>
  );
}
