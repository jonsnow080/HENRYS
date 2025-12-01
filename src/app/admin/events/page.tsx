import type { Metadata } from "next";
import Link from "next/link";
import { RsvpStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateEventWizard } from "./create-event-wizard";

type SearchParams = Record<string, string | string[] | undefined>;

type EventRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  details: string | null;
  startAt: Date;
  endAt: Date;
  capacity: number;
  priceCents: number;
  visibility: boolean;
  rsvpDeadline: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  venueHiddenUntil: Date | null;
  createdAt: Date;
};

type EventRsvpRecord = {
  eventId: string;
  status: string;
};

type AdminEvent = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  details: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  priceCents: number;
  visibility: boolean;
  rsvpDeadline: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  venueHiddenUntil: Date | null;
  createdAt: Date;
  stats: {
    going: number;
    waitlist: number;
    canceled: number;
  };
  location: {
    city: string;
    country: string;
  };
  focus: "dating" | "social";
  timeframe: "upcoming" | "past";
  revenueCents: number;
  availability: "available" | "waitlist";
  isPaid: boolean;
  fillRate: number;
};

type TrendPoint = {
  label: string;
  count: number;
};

type DeltaDescriptor = {
  label: string;
  tone: "positive" | "negative" | "neutral";
};

const SORT_OPTIONS = ["start-desc", "start-asc", "name", "created", "attendance", "revenue"] as const;
const FOCUS_OPTIONS = ["all", "dating", "social"] as const;
const TICKET_OPTIONS = ["all", "paid", "free"] as const;
const AVAILABILITY_OPTIONS = ["all", "available", "waitlist"] as const;
const VISIBILITY_OPTIONS = ["all", "public", "private"] as const;
const TIMEFRAME_OPTIONS = ["upcoming", "past", "all"] as const;
const PAGE_SIZE = 8;

export const metadata: Metadata = {
  title: `Events · ${SITE_COPY.name}`,
  description: "Manage RSVPs, visibility, and logistics for upcoming gatherings.",
};

export default async function AdminEventsPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const now = new Date();

  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const visibilityParamRaw = typeof searchParams.visibility === "string" ? searchParams.visibility : "all";
  const visibilityParam = (VISIBILITY_OPTIONS.includes(visibilityParamRaw as (typeof VISIBILITY_OPTIONS)[number])
    ? visibilityParamRaw
    : "all") as (typeof VISIBILITY_OPTIONS)[number];

  const timeframeParamRaw = typeof searchParams.timeframe === "string" ? searchParams.timeframe : "upcoming";
  const timeframeParam = (TIMEFRAME_OPTIONS.includes(timeframeParamRaw as (typeof TIMEFRAME_OPTIONS)[number])
    ? timeframeParamRaw
    : "upcoming") as (typeof TIMEFRAME_OPTIONS)[number];

  const sortParamRaw = typeof searchParams.sort === "string" ? searchParams.sort : "start-desc";
  const sort = (SORT_OPTIONS.includes(sortParamRaw as (typeof SORT_OPTIONS)[number])
    ? sortParamRaw
    : "start-desc") as (typeof SORT_OPTIONS)[number];

  const pageParam = Number.parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10);

  const countryParamRaw = typeof searchParams.country === "string" ? searchParams.country : "all";
  const countryParam = countryParamRaw || "all";

  const cityParamRaw = typeof searchParams.city === "string" ? searchParams.city : "all";
  const cityParam = cityParamRaw || "all";

  const focusParamRaw = typeof searchParams.focus === "string" ? searchParams.focus : "all";
  const focusParam = (FOCUS_OPTIONS.includes(focusParamRaw as (typeof FOCUS_OPTIONS)[number])
    ? focusParamRaw
    : "all") as (typeof FOCUS_OPTIONS)[number];

  const ticketParamRaw = typeof searchParams.ticket === "string" ? searchParams.ticket : "all";
  const ticketParam = (TICKET_OPTIONS.includes(ticketParamRaw as (typeof TICKET_OPTIONS)[number])
    ? ticketParamRaw
    : "all") as (typeof TICKET_OPTIONS)[number];

  const availabilityParamRaw = typeof searchParams.availability === "string" ? searchParams.availability : "all";
  const availabilityParam = (AVAILABILITY_OPTIONS.includes(availabilityParamRaw as (typeof AVAILABILITY_OPTIONS)[number])
    ? availabilityParamRaw
    : "all") as (typeof AVAILABILITY_OPTIONS)[number];

  const startParam = typeof searchParams.start === "string" ? searchParams.start : "";
  const endParam = typeof searchParams.end === "string" ? searchParams.end : "";

  const startDateFilter = parseDateParam(startParam);
  const endDateFilter = parseEndDateParam(endParam);

  const events = (await prisma.event.findMany({
    orderBy: { startAt: "asc" },
  })) as EventRecord[];

  const allEventIds = events.map((event) => event.id);
  const rsvps = allEventIds.length
    ? ((await prisma.eventRsvp.findMany({ where: { eventId: { in: allEventIds } } })) as EventRsvpRecord[])
    : [];

  const groupedRsvps = new Map<string, { going: number; waitlist: number; canceled: number }>();
  for (const event of events) {
    groupedRsvps.set(event.id, { going: 0, waitlist: 0, canceled: 0 });
  }
  for (const rsvp of rsvps) {
    const stats = groupedRsvps.get(rsvp.eventId);
    if (!stats) continue;
    if (rsvp.status === RsvpStatus.GOING) stats.going += 1;
    if (rsvp.status === RsvpStatus.WAITLISTED) stats.waitlist += 1;
    if (rsvp.status === RsvpStatus.CANCELED) stats.canceled += 1;
  }

  const adminEvents: AdminEvent[] = events.map((event) => {
    const stats = groupedRsvps.get(event.id) ?? { going: 0, waitlist: 0, canceled: 0 };
    const focus = deriveEventFocus(event);
    const location = deriveEventLocation(event);
    const timeframe = classifyTimeframe(event, now);
    const revenueCents = stats.going * event.priceCents;
    const availability = stats.going >= event.capacity ? "waitlist" : "available";
    const fillRate = event.capacity > 0 ? stats.going / event.capacity : 0;

    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      summary: event.summary ?? "",
      details: event.details ?? "",
      startAt: event.startAt,
      endAt: event.endAt,
      capacity: event.capacity,
      priceCents: event.priceCents,
      visibility: event.visibility,
      rsvpDeadline: event.rsvpDeadline,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      venueHiddenUntil: event.venueHiddenUntil,
      createdAt: event.createdAt,
      stats,
      location,
      focus,
      timeframe,
      revenueCents,
      availability,
      isPaid: event.priceCents > 0,
      fillRate,
    };
  });

  const countries = Array.from(new Set(adminEvents.map((event) => event.location.country))).sort((a, b) =>
    a.localeCompare(b),
  );
  const relevantCities = adminEvents.filter((event) => countryParam === "all" || event.location.country === countryParam);
  const cities = Array.from(new Set(relevantCities.map((event) => event.location.city))).sort((a, b) =>
    a.localeCompare(b),
  );

  const filtered = adminEvents.filter((event) => {
    if (query) {
      const haystack = `${event.name} ${event.summary} ${event.details}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) {
        return false;
      }
    }

    if (visibilityParam === "public" && !event.visibility) return false;
    if (visibilityParam === "private" && event.visibility) return false;

    if (timeframeParam !== "all" && event.timeframe !== timeframeParam) return false;

    if (countryParam !== "all" && event.location.country !== countryParam) return false;
    if (cityParam !== "all" && event.location.city !== cityParam) return false;

    if (focusParam !== "all" && event.focus !== focusParam) return false;

    if (ticketParam === "paid" && !event.isPaid) return false;
    if (ticketParam === "free" && event.isPaid) return false;

    if (availabilityParam === "available" && event.availability !== "available") return false;
    if (availabilityParam === "waitlist" && event.availability !== "waitlist") return false;

    if (startDateFilter && event.startAt < startDateFilter) return false;
    if (endDateFilter && event.startAt > endDateFilter) return false;

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sort === "created") {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (sort === "start-asc") {
      return a.startAt.getTime() - b.startAt.getTime();
    }
    if (sort === "attendance") {
      return b.stats.going - a.stats.going;
    }
    if (sort === "revenue") {
      return b.revenueCents - a.revenueCents;
    }
    return b.startAt.getTime() - a.startAt.getTime();
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(pageParam || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEvents = sorted.slice(startIndex, startIndex + PAGE_SIZE);

  const metrics = buildDashboardMetrics(filtered, now);

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

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          title="Upcoming Events"
          value={formatNumber(metrics.upcomingCount)}
          helper="Next 30 days · Based on current filters"
          delta={metrics.upcomingDelta}
        />
        <MetricCard
          title="Confirmed Guests"
          value={formatNumber(metrics.confirmedGuests)}
          helper="Across upcoming events"
          delta={metrics.confirmedGuestsDelta}
        />
        <MetricCard
          title="Average Fill Rate"
          value={formatPercent(metrics.averageFillRate)}
          helper={`Waitlist ${formatNumber(metrics.waitlistGuests)} guests`}
          delta={metrics.fillRateDelta}
        />
        <MetricCard
          title="Revenue Forecast"
          value={formatCurrency(metrics.revenueForecastCents)}
          helper="Projected from confirmed guests"
          delta={metrics.revenueDelta}
        />

        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Event velocity</CardTitle>
              <CardDescription>Monthly cadence over the last six months.</CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming</p>
                <p className="text-lg font-semibold text-foreground">{formatNumber(metrics.upcomingTotal)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Past</p>
                <p className="text-lg font-semibold text-foreground">{formatNumber(metrics.pastTotal)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EventVelocityChart data={metrics.monthlyTrend} />
          </CardContent>
        </Card>
      </div>

      <EventsFilterForm
        defaultQuery={query}
        defaultVisibility={visibilityParam}
        defaultTimeframe={timeframeParam}
        defaultSort={sort}
        defaultCountry={countryParam}
        defaultCity={cityParam}
        defaultFocus={focusParam}
        defaultTicket={ticketParam}
        defaultAvailability={availabilityParam}
        defaultStart={startParam}
        defaultEnd={endParam}
        countries={countries}
        cities={cities}
      />

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No events match these filters yet.
                </TableCell>
              </TableRow>
            ) : (
              pageEvents.map((event) => (
                <TableRow key={event.id} className="align-top">
                  <TableCell>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{event.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            event.focus === "dating"
                              ? "border-transparent bg-rose-500/10 text-rose-600"
                              : "border-transparent bg-sky-500/10 text-sky-600"
                          }
                        >
                          {event.focus === "dating" ? "Dating" : "Social"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            event.timeframe === "upcoming"
                              ? "border-transparent bg-emerald-500/10 text-emerald-600"
                              : "border-transparent bg-muted text-muted-foreground"
                          }
                        >
                          {event.timeframe === "upcoming" ? "Upcoming" : "Past"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.summary}</p>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Ticket: {event.priceCents > 0 ? formatCurrency(event.priceCents) : "Complimentary"} · Capacity {event.capacity}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">{event.location.city}</p>
                      <p>{event.location.country}</p>
                      {event.venueName ? <p>Venue: {event.venueName}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{formatDateRange(event.startAt, event.endAt)}</p>
                      {event.rsvpDeadline ? <p>RSVP by {formatDate(event.rsvpDeadline)}</p> : null}
                      {event.venueHiddenUntil ? <p>Reveal venue {formatDate(event.venueHiddenUntil)}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">
                        {event.stats.going}/{event.capacity} confirmed
                      </p>
                      <p>Fill rate {formatPercent(event.fillRate)}</p>
                      <p>Waitlist {event.stats.waitlist}</p>
                      <Badge
                        variant="outline"
                        className={
                          event.availability === "available"
                            ? "border-transparent bg-emerald-500/10 text-emerald-600"
                            : "border-transparent bg-amber-500/10 text-amber-600"
                        }
                      >
                        {event.availability === "available" ? "Seats open" : "Waitlist only"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">
                        {event.priceCents > 0 ? formatCurrency(event.revenueCents) : "—"}
                      </p>
                      <p>
                        {event.priceCents > 0
                          ? `${formatCurrency(event.priceCents)} per guest`
                          : "Complimentary experience"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.visibility ? (
                      <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-600">
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-transparent bg-amber-500/10 text-amber-600">
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
          country: countryParam,
          city: cityParam,
          focus: focusParam,
          ticket: ticketParam,
          availability: availabilityParam,
          start: startParam,
          end: endParam,
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
  defaultCountry,
  defaultCity,
  defaultFocus,
  defaultTicket,
  defaultAvailability,
  defaultStart,
  defaultEnd,
  countries,
  cities,
}: {
  defaultQuery: string;
  defaultVisibility: (typeof VISIBILITY_OPTIONS)[number];
  defaultTimeframe: (typeof TIMEFRAME_OPTIONS)[number];
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultCountry: string;
  defaultCity: string;
  defaultFocus: (typeof FOCUS_OPTIONS)[number];
  defaultTicket: (typeof TICKET_OPTIONS)[number];
  defaultAvailability: (typeof AVAILABILITY_OPTIONS)[number];
  defaultStart: string;
  defaultEnd: string;
  countries: string[];
  cities: string[];
}) {
  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 md:grid-cols-2 xl:grid-cols-6"
      method="get"
    >
      <div className="space-y-2 xl:col-span-2">
        <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <Input id="q" name="q" placeholder="Name or summary" defaultValue={defaultQuery} />
      </div>
      <div className="space-y-2">
        <label htmlFor="country" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Country
        </label>
        <select
          id="country"
          name="country"
          defaultValue={defaultCountry}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="city" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          City
        </label>
        <select
          id="city"
          name="city"
          defaultValue={defaultCity}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="focus" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Event type
        </label>
        <select
          id="focus"
          name="focus"
          defaultValue={defaultFocus}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">Dating &amp; social</option>
          <option value="dating">Dating only</option>
          <option value="social">Social only</option>
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
        <label htmlFor="visibility" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Visibility
        </label>
        <select
          id="visibility"
          name="visibility"
          defaultValue={defaultVisibility}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All events</option>
          <option value="public">Public only</option>
          <option value="private">Hidden</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="ticket" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ticket type
        </label>
        <select
          id="ticket"
          name="ticket"
          defaultValue={defaultTicket}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All prices</option>
          <option value="paid">Paid events</option>
          <option value="free">Complimentary</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="availability" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Availability
        </label>
        <select
          id="availability"
          name="availability"
          defaultValue={defaultAvailability}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="available">Seats open</option>
          <option value="waitlist">Waitlist only</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="start" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Start date
        </label>
        <Input id="start" name="start" type="date" defaultValue={defaultStart} />
      </div>
      <div className="space-y-2">
        <label htmlFor="end" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          End date
        </label>
        <Input id="end" name="end" type="date" defaultValue={defaultEnd} />
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
          <option value="attendance">Most attendees</option>
          <option value="revenue">Highest revenue</option>
          <option value="name">Name A→Z</option>
          <option value="created">Recently created</option>
        </select>
      </div>
      <div className="flex items-end gap-2 xl:col-span-2">
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
  baseSearchParams: Partial<Record<string, string>>;
}) {
  if (totalPages <= 1) return null;
  const prevPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(baseSearchParams)) {
      if (!value) continue;
      params.set(key, value);
    }
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

function MetricCard({
  title,
  value,
  helper,
  delta,
}: {
  title: string;
  value: string;
  helper?: string;
  delta?: DeltaDescriptor | null;
}) {
  return (
    <Card className="bg-card/80">
      <CardHeader className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {helper ? <p className="text-sm text-muted-foreground">{helper}</p> : null}
        {delta ? (
          <p
            className={`text-xs font-semibold ${delta.tone === "positive"
                ? "text-emerald-600"
                : delta.tone === "negative"
                  ? "text-rose-600"
                  : "text-muted-foreground"
              }`}
          >
            {delta.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EventVelocityChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Not enough events to visualize yet.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((point) => point.count), 1);
  const viewWidth = 360;
  const viewHeight = 160;
  const paddingX = 24;
  const paddingTop = 20;
  const paddingBottom = 32;
  const chartWidth = viewWidth - paddingX * 2;
  const chartHeight = viewHeight - (paddingTop + paddingBottom);
  const step = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const baselineY = paddingTop + chartHeight;

  const coordinates = data.map((entry, index) => {
    const x = paddingX + (data.length > 1 ? step * index : chartWidth / 2);
    const ratio = entry.count / maxCount;
    const y = baselineY - ratio * chartHeight;
    return { x, y };
  });

  const areaPath = [
    `M ${coordinates[0]?.x ?? paddingX} ${baselineY}`,
    ...coordinates.map((point) => `L ${point.x} ${point.y}`),
    `L ${coordinates.at(-1)?.x ?? paddingX} ${baselineY}`,
    "Z",
  ].join(" ");
  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="h-40 w-full">
        <defs>
          <linearGradient id="events-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="transparent" />
        <path d={areaPath} fill="url(#events-gradient)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coordinates.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={3.5} fill="hsl(var(--primary))" />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-6">
        {data.map((entry) => (
          <div key={entry.label} className="flex flex-col rounded-xl bg-muted/40 px-3 py-2">
            <span className="text-[11px] uppercase tracking-wide">{entry.label}</span>
            <span className="text-sm font-semibold text-foreground">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildDashboardMetrics(events: AdminEvent[], reference: Date) {
  const upcomingEvents = events.filter((event) => event.timeframe === "upcoming");
  const pastEvents = events.filter((event) => event.timeframe === "past");

  const upcomingCount = upcomingEvents.length;
  const confirmedGuests = upcomingEvents.reduce((sum, event) => sum + event.stats.going, 0);
  const totalCapacity = upcomingEvents.reduce((sum, event) => sum + event.capacity, 0);
  const averageFillRate = totalCapacity > 0 ? confirmedGuests / totalCapacity : 0;
  const waitlistGuests = upcomingEvents.reduce((sum, event) => sum + event.stats.waitlist, 0);
  const revenueForecastCents = upcomingEvents.reduce((sum, event) => sum + event.revenueCents, 0);

  const windowMs = 1000 * 60 * 60 * 24 * 30;
  const now = reference.getTime();
  const upcomingWindowEvents = events.filter(
    (event) => event.startAt.getTime() >= now && event.startAt.getTime() < now + windowMs,
  );
  const previousWindowEvents = events.filter(
    (event) => event.startAt.getTime() >= now - windowMs && event.startAt.getTime() < now,
  );

  const upcomingDelta = describeCountDelta(upcomingWindowEvents.length - previousWindowEvents.length);

  const upcomingWindowGuests = upcomingWindowEvents.reduce((sum, event) => sum + event.stats.going, 0);
  const previousWindowGuests = previousWindowEvents.reduce((sum, event) => sum + event.stats.going, 0);
  const confirmedGuestsDelta = describeCountDelta(upcomingWindowGuests - previousWindowGuests);

  const upcomingWindowCapacity = upcomingWindowEvents.reduce((sum, event) => sum + event.capacity, 0);
  const previousWindowCapacity = previousWindowEvents.reduce((sum, event) => sum + event.capacity, 0);
  const upcomingFill = upcomingWindowCapacity > 0 ? upcomingWindowGuests / upcomingWindowCapacity : 0;
  const previousFill = previousWindowCapacity > 0 ? previousWindowGuests / previousWindowCapacity : 0;
  const fillRateDelta = describePercentDelta(upcomingFill - previousFill);

  const upcomingRevenue = upcomingWindowEvents.reduce((sum, event) => sum + event.revenueCents, 0);
  const previousRevenue = previousWindowEvents.reduce((sum, event) => sum + event.revenueCents, 0);
  const revenueDelta = describeCurrencyDelta(upcomingRevenue - previousRevenue);

  const monthlyTrend = buildMonthlyTrend(events, reference, 6);

  return {
    upcomingCount,
    confirmedGuests,
    averageFillRate,
    waitlistGuests,
    revenueForecastCents,
    upcomingDelta,
    confirmedGuestsDelta,
    fillRateDelta,
    revenueDelta,
    upcomingTotal: upcomingEvents.length,
    pastTotal: pastEvents.length,
    monthlyTrend,
  };
}

function buildMonthlyTrend(events: AdminEvent[], reference: Date, months: number): TrendPoint[] {
  const points: TrendPoint[] = [];
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - (months - 1), 1));
  for (let index = 0; index < months; index += 1) {
    const monthDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const monthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1));
    const count = events.filter(
      (event) => event.startAt.getTime() >= monthDate.getTime() && event.startAt.getTime() < monthEnd.getTime(),
    ).length;
    const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthDate);
    points.push({ label, count });
  }
  return points;
}

function describeCountDelta(delta: number): DeltaDescriptor {
  if (delta === 0) {
    return { label: "No change vs last 30 days", tone: "neutral" };
  }
  const sign = delta > 0 ? "+" : "−";
  return {
    label: `${sign}${Math.abs(delta)} vs last 30 days`,
    tone: delta > 0 ? "positive" : "negative",
  };
}

function describePercentDelta(delta: number): DeltaDescriptor {
  if (Math.abs(delta) < 0.0001) {
    return { label: "No change vs last 30 days", tone: "neutral" };
  }
  const sign = delta > 0 ? "+" : "−";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Math.abs(delta) * 100);
  return {
    label: `${sign}${formatted} pts vs last 30 days`,
    tone: delta > 0 ? "positive" : "negative",
  };
}

function describeCurrencyDelta(deltaCents: number): DeltaDescriptor {
  if (deltaCents === 0) {
    return { label: "No change vs last 30 days", tone: "neutral" };
  }
  const sign = deltaCents > 0 ? "+" : "−";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(deltaCents) / 100);
  return {
    label: `${sign}${formatted} vs last 30 days`,
    tone: deltaCents > 0 ? "positive" : "negative",
  };
}

function deriveEventFocus(event: EventRecord): "dating" | "social" {
  const text = `${event.name} ${event.summary ?? ""} ${event.details ?? ""}`.toLowerCase();
  const socialKeywords = ["dinner", "salon", "social", "soiree", "party", "gather", "mixer", "salon"];
  const datingKeywords = ["date", "match", "pairing", "romance", "love", "slow dating", "chemistry"];

  if (socialKeywords.some((keyword) => text.includes(keyword))) {
    return "social";
  }
  if (datingKeywords.some((keyword) => text.includes(keyword))) {
    return "dating";
  }
  return event.priceCents === 0 ? "social" : "dating";
}

function deriveEventLocation(event: EventRecord): { city: string; country: string } {
  const address = event.venueAddress ?? "";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length >= 2) {
    const country = parts[parts.length - 1] ?? "Unknown";
    const city = parts[parts.length - 2] ?? "TBD";
    return { city, country };
  }
  if (parts.length === 1) {
    return { city: parts[0] ?? "TBD", country: "Unknown" };
  }
  if (event.venueName) {
    return { city: event.venueName, country: "Unknown" };
  }
  return { city: "TBD", country: "Unknown" };
}

function classifyTimeframe(event: EventRecord, reference: Date): "upcoming" | "past" {
  const now = reference.getTime();
  return event.endAt.getTime() < now ? "past" : "upcoming";
}

function parseDateParam(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((segment) => Number.parseInt(segment, 10));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function parseEndDateParam(value: string): Date | null {
  const start = parseDateParam(value);
  if (!start) return null;
  return new Date(start.getTime() + 1000 * 60 * 60 * 24 - 1);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDateRange(start: Date, end: Date) {
  const startFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
  const endFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });
  return `${startFormatter.format(start)} → ${endFormatter.format(end)}`;
}

