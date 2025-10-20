import type { Metadata } from "next";
import Link from "next/link";
import { Role, ApplicationStatus } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: `Admin · ${SITE_COPY.name}`,
  description: "Operational controls for the HENRYS team.",
};

export default async function AdminHomePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const now = new Date();

  const [submitted, waitlist, approved, upcomingEvents] = await Promise.all([
    prisma.application.count({ where: { status: ApplicationStatus.SUBMITTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.WAITLIST } }),
    prisma.application.count({ where: { status: ApplicationStatus.APPROVED } }),
    prisma.event.count({ where: { startAt: { gte: now } } }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Admin</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Welcome back, {session.user.name ?? "team"}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review new member applications, manage rosters, and keep vibes immaculate.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New" value={submitted} description="Need review" />
        <StatCard label="Waitlist" value={waitlist} description="Pending future cohorts" />
        <StatCard label="Approved" value={approved} description="Invited members" />
        <StatCard
          label="Upcoming events"
          value={upcomingEvents}
          description="On the calendar"
        />
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
