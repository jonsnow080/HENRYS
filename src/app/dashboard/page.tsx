import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { SignOutButton } from "@/ui/SignOutButton";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { RsvpStatus } from "@/lib/prisma-constants";
import { type MembershipPlanOption } from "./_components/subscribe-card";
import { BillingPortalButton } from "./_components/billing-portal-button";
import { ReceiptsTable, type ReceiptRow } from "./_components/receipts-table";
import { MyEventsList, type EventRsvpRow } from "./_components/my-events-list";

export const metadata: Metadata = {
  title: "Member dashboard",
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

type MembershipPlanRecord = {
  id: string;
  name: string;
  perksJSON: unknown;
};

function parsePerks(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  }
  return [];
}

export default async function DashboardPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined> | undefined>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();

  const [plansData, subscription, payments, upcomingRsvpsData, pastRsvpsData] = await Promise.all([
    prisma.membershipPlan.findMany(),
    prisma.subscription.findFirst({ where: { userId } }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventRsvp.findMany({
      where: {
        userId,
        status: { in: [RsvpStatus.GOING, RsvpStatus.WAITLISTED] },
        event: {
          startAt: { gte: now },
        },
      },
      include: {
        event: true,
      },
      orderBy: {
        event: {
          startAt: "asc",
        },
      },
    }),
    prisma.eventRsvp.findMany({
      where: {
        userId,
        status: { in: [RsvpStatus.GOING] },
        event: {
          startAt: { lt: now }
        }
      },
      include: {
        event: true
      },
      orderBy: {
        event: {
          startAt: 'desc'
        }
      }
    })
  ]);

  const plansRaw = plansData as MembershipPlanRecord[];

  const plans: MembershipPlanOption[] = plansRaw.map((plan) => ({
    id: plan.id,
    name: plan.name,
    perks: parsePerks(plan.perksJSON),
  }));

  const activePlan = subscription
    ? plans.find((plan) => plan.id === subscription.planId) ?? null
    : null;
  const hasActiveSubscription = subscription ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) : false;

  const rsvps: EventRsvpRow[] = upcomingRsvpsData.map((rsvp) => ({
    eventId: rsvp.eventId,
    eventName: rsvp.event.name,
    startAt: rsvp.event.startAt,
    status: rsvp.status,
    venue: rsvp.event.venueName ?? rsvp.event.venue ?? null,
  }));

  const pastRsvps: EventRsvpRow[] = pastRsvpsData.map((rsvp) => ({
    eventId: rsvp.eventId,
    eventName: rsvp.event.name,
    startAt: rsvp.event.startAt,
    status: rsvp.status,
    venue: rsvp.event.venueName ?? rsvp.event.venue ?? null,
  }));

  const receipts: ReceiptRow[] = [];
  for (const payment of payments) {
    let description = payment.description ?? "";
    if (!description && payment.eventId) {
      const event = await prisma.event.findUnique({ where: { id: payment.eventId } });
      if (event) {
        description = `${event.name} ticket`;
      }
    }
    if (!description && activePlan) {
      description = `${activePlan.name} membership`;
    }
    receipts.push({
      id: payment.id,
      createdAt: payment.createdAt,
      description,
      amount: formatCurrency(payment.amount, payment.currency),
      receiptUrl: payment.receiptUrl,
    });
  }

  const checkoutStatus = typeof searchParams?.checkout === "string" ? searchParams?.checkout : undefined;
  const billingStatus = typeof searchParams?.billing === "string" ? searchParams?.billing : undefined;

  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-muted-foreground">
          Your RSVP history, receipts, and membership tools live here. Tickets and memberships do not include food or drink—
          curated menus will be available to purchase on the night.
        </p>
        {checkoutStatus === "success" && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100">
            Checkout complete. We&apos;ve emailed a Stripe receipt and updated your dashboard.
          </div>
        )}
        {checkoutStatus === "cancelled" && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            You cancelled checkout before confirming payment. You can restart whenever you&apos;re ready.
          </div>
        )}
        {billingStatus === "return" && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm text-sky-900 dark:text-sky-100">
            Billing portal closed. Changes may take a moment to sync from Stripe.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Events</h2>
        <MyEventsList rsvps={rsvps} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Past Events</h2>
        <MyEventsList rsvps={pastRsvps} allowCancel={false} />
      </div>

      {hasActiveSubscription ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Active membership</p>
              <h2 className="mt-1 text-2xl font-semibold">{activePlan?.name ?? "HENRYS membership"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{subscription?.status ?? "active"}</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Billing is handled directly in Stripe. Update cards, manage renewals, or download invoices from the portal.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <BillingPortalButton />
            <p className="text-xs text-muted-foreground">Opens the Stripe Billing Portal</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 text-center">
          <p className="text-muted-foreground">
            You do not have an active membership.{" "}
            <a href="/offers" className="font-medium text-foreground underline">
              View offers
            </a>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Receipts</h2>
          <p className="text-sm text-muted-foreground">
            Every ticket and membership renewal routes through Stripe checkout. Download official receipts anytime.
          </p>
        </div>
        <ReceiptsTable receipts={receipts} />
      </div>
    </div>
  );
}
