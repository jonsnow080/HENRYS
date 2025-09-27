import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateEventWizard } from "./create-event-wizard";

export const metadata: Metadata = {
  title: `Events · ${SITE_COPY.name}`,
  description: "Manage RSVPs, visibility, and logistics for upcoming gatherings.",
};

type SearchParams = Record<string, string | string[] | undefined>;

type AdminEvent = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  priceCents: number;
  visibility: boolean;
  rsvpDeadline: Date | null;
  venueName: string | null;
  venueHiddenUntil: Date | null;
  stats: {
    going: number;
    waitlist: number;
    canceled: number;
  };
};

const SORT_OPTIONS = ["start-desc", "start-asc", "name", "created"] as const;

const PAGE_SIZE = 8;

export default async function AdminEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const visibilityParam = typeof searchParams.visibility === "string" ? searchParams.visibility : "all";
  const timeframeParam = typeof searchParams.timeframe === "string" ? searchParams.timeframe : "upcoming";
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "start-desc";
  const pageParam = Number.parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10);

  const sort = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
    ? (sortParam as (typeof SORT_OPTIONS)[number])
    : "start-desc";

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });

  const filtered = events.filter((event) => {
    if (query) {
      const haystack = `${event.name} ${event.summary ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) {
        return false;
      }
    }
    if (visibilityParam === "public" && !event.visibility) return false;
    if (visibilityParam === "private" && event.visibility) return false;

    const now = new Date();
    if (timeframeParam === "upcoming" && event.endAt.getTime() < now.getTime()) {
      return false;
    }
    if (timeframeParam === "past" && event.startAt.getTime() >= now.getTime()) {
      return false;
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sort === "created") {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (sort === "start-asc") {
      return a.startAt.getTime() - b.startAt.getTime();
    }
    return b.startAt.getTime() - a.startAt.getTime();
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(pageParam || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEvents = sorted.slice(startIndex, startIndex + PAGE_SIZE);

  const eventIds = pageEvents.map((event) => event.id);
  const rsvps = eventIds.length
    ? await prisma.eventRsvp.findMany({ where: { eventId: { in: eventIds } } })
    : [];

  const grouped = new Map<string, { going: number; waitlist: number; canceled: number }>();
  for (const event of pageEvents) {
    grouped.set(event.id, { going: 0, waitlist: 0, canceled: 0 });
  }
  for (const rsvp of rsvps) {
    const bucket = grouped.get(rsvp.eventId);
    if (!bucket) continue;
    if (rsvp.status === RsvpStatus.GOING) bucket.going += 1;
    if (rsvp.status === RsvpStatus.WAITLISTED) bucket.waitlist += 1;
    if (rsvp.status === RsvpStatus.CANCELED) bucket.canceled += 1;
  }

  const adminEvents: AdminEvent[] = pageEvents.map((event) => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    summary: event.summary,
    startAt: event.startAt,
    endAt: event.endAt,
    capacity: event.capacity,
    priceCents: event.priceCents,
    visibility: event.visibility,
    rsvpDeadline: event.rsvpDeadline,
    venueName: event.venueName,
    venueHiddenUntil: event.venueHiddenUntil,
    stats: grouped.get(event.id) ?? { going: 0, waitlist: 0, canceled: 0 },
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Events</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Host unforgettable nights</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track RSVPs, refine visibility, and set the tone for every HENRYS gathering.
          </p>
        </div>
        <CreateEventWizard />
      </header>

      <EventsFilterForm
        defaultQuery={query}
        defaultVisibility={visibilityParam}
        defaultTimeframe={timeframeParam}
        defaultSort={sort}
      />

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>RSVPs</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No events match these filters yet.
                </TableCell>
              </TableRow>
            ) : (
              adminEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.summary}</p>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Ticket: {formatCurrency(event.priceCents)} · Capacity {event.capacity}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <p>{formatDateRange(event.startAt, event.endAt)}</p>
                      {event.rsvpDeadline ? (
                        <p>RSVP by {formatDate(event.rsvpDeadline)}</p>
                      ) : null}
                      {event.venueHiddenUntil ? (
                        <p>Reveal venue {formatDate(event.venueHiddenUntil)}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-semibold text-foreground">Going:</span> {event.stats.going}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Waitlist:</span> {event.stats.waitlist}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Canceled:</span> {event.stats.canceled}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.visibility ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                        Hidden
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/rsvps`}>RSVPs</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/match`}>Match</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseSearchParams={{
          q: query,
          visibility: visibilityParam,
          timeframe: timeframeParam,
          sort,
        }}
      />
    </div>
  );
}

function EventsFilterForm({
  defaultQuery,
  defaultVisibility,
  defaultTimeframe,
  defaultSort,
}: {
  defaultQuery: string;
  defaultVisibility: string;
  defaultTimeframe: string;
  defaultSort: (typeof SORT_OPTIONS)[number];
}) {
  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 sm:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto] sm:items-end"
      method="get"
    >
      <div className="space-y-2">
        <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <Input id="q" name="q" placeholder="Name or summary" defaultValue={defaultQuery} />
      </div>
      <div className="space-y-2">
        <label htmlFor="visibility" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Visibility
        </label>
        <select
          id="visibility"
          name="visibility"
          defaultValue={defaultVisibility}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="public">Public only</option>
          <option value="private">Hidden</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="timeframe" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Timeframe
        </label>
        <select
          id="timeframe"
          name="timeframe"
          defaultValue={defaultTimeframe}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={defaultSort}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="start-desc">Start date ↓</option>
          <option value="start-asc">Start date ↑</option>
          <option value="name">Name A→Z</option>
          <option value="created">Recently created</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 px-6">
          Apply
        </Button>
        <Link
          href="/admin/events"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

function Pagination({
  currentPage,
  totalPages,
  baseSearchParams,
}: {
  currentPage: number;
  totalPages: number;
  baseSearchParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;
  const prevPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  const buildHref = (page: number) => {
    const params = new URLSearchParams(baseSearchParams);
    params.set("page", String(page));
    return `/admin/events?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between rounded-[24px] border border-border/60 bg-background/80 px-4 py-3 text-xs text-muted-foreground">
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild disabled={currentPage === 1}>
          <Link href={buildHref(prevPage)}>Previous</Link>
        </Button>
        <Button variant="outline" size="sm" asChild disabled={currentPage === totalPages}>
          <Link href={buildHref(nextPage)}>Next</Link>
        </Button>
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDateRange(start: Date, end: Date) {
  const startFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
  const endFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });
  return `${startFormatter.format(start)} → ${endFormatter.format(end)}`;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
