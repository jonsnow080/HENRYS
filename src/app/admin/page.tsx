import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatus, Role } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { Button } from "@/components/ui/button";
import { CreateEventWizard } from "./events/create-event-wizard";
import { approveApplicationAction } from "./actions";

export const metadata: Metadata = {
  title: `Admin · ${SITE_COPY.name}`,
  description: "Operational controls for the HENRYS team.",
};

export default async function AdminHomePage() {
  const session = await auth();

  const now = new Date();

  const [
    submitted,
    waitlist,
    approved,
    upcomingEvents,
    activeMembers,
    pendingApplications,
    upcomingAdminEvents,
  ] = await Promise.all([
    prisma.application.count({ where: { status: ApplicationStatus.SUBMITTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.WAITLIST } }),
    prisma.application.count({ where: { status: ApplicationStatus.APPROVED } }),
    prisma.event.count({ where: { startAt: { gte: now } } }),
    prisma.user.count({ where: { role: { in: [Role.MEMBER, Role.HOST] } } }),
    prisma.application.findMany({
      where: { status: ApplicationStatus.SUBMITTED },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.event.findMany({
      where: { startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 4,
      select: {
        id: true,
        name: true,
        startAt: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Admin</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Welcome back, {session?.user?.name ?? "team"}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review new member applications, manage rosters, and keep vibes immaculate.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active members" value={activeMembers} description="Member & host profiles" />
        <StatCard label="New applications" value={submitted} description="Need review" />
        <StatCard label="Waitlist" value={waitlist} description="Pending future cohorts" />
        <StatCard label="Approved" value={approved} description="Invited members" />
        <StatCard label="Upcoming events" value={upcomingEvents} description="On the calendar" />
      </section>

      <section className="grid gap-4 rounded-[32px] border border-border/70 bg-card/70 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <AdminLinkCard
          href="/admin/applications"
          title="Applications"
          description="Search, filter, and decide on prospective members."
        />
        <AdminLinkCard
          href="/admin/events"
          title="Events"
          description="Review RSVPs and spin up new gatherings in minutes."
        />
        <AdminLinkCard
          href="/admin/email-previews"
          title="Email previews"
          description="Review transactional templates before they go out."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PendingApplicationsPanel applications={pendingApplications} />
        <UpcomingEventsPanel events={upcomingAdminEvents} />
      </section>
    </div>
  );
}

type PendingApplication = {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
};

const applicationDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function PendingApplicationsPanel({ applications }: { applications: PendingApplication[] }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-[32px] border border-border/70 bg-card/70 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Applications</p>
          <h2 className="text-xl font-semibold">Awaiting approval</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full px-4">
          <Link href="/admin/applications">Review all</Link>
        </Button>
      </div>
      {applications.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center text-sm text-muted-foreground">
          You’re all caught up. New submissions will land here.
        </p>
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.id}>
              <form
                action={approveApplicationAction}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <input type="hidden" name="applicationId" value={application.id} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{application.fullName}</p>
                  <p className="text-xs text-muted-foreground">{application.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {applicationDateFormatter.format(application.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" className="rounded-full px-4">
                    Approve
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full px-4">
                    <Link href="/admin/applications">Open queue</Link>
                  </Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type UpcomingEvent = {
  id: string;
  name: string;
  startAt: Date;
};

const eventDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function UpcomingEventsPanel({ events }: { events: UpcomingEvent[] }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-[32px] border border-border/70 bg-card/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Events</p>
          <h2 className="text-xl font-semibold">On the horizon</h2>
        </div>
        <CreateEventWizard />
      </div>
      {events.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center text-sm text-muted-foreground">
          No upcoming events yet. Spin one up to get members mingling.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}/rsvps`}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/70 p-4 transition hover:border-foreground/50 hover:bg-background"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">{event.name}</p>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Manage →</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {eventDateFormatter.format(event.startAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button asChild variant="ghost" size="sm" className="self-start rounded-full px-4">
        <Link href="/admin/events">See all events</Link>
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function AdminLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-border/70 bg-background/80 p-6 transition hover:border-foreground/50 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-sm font-semibold text-muted-foreground transition group-hover:text-foreground">Open →</span>
      </div>
    </Link>
  );
}
