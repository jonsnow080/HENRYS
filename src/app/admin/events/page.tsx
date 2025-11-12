import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  currency: string;
  visibility: boolean;
  rsvpDeadline: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  venueHiddenUntil: Date | null;
  locationCity: string;
  locationCountry: string;
  category: "dating" | "social";
  priceType: "free" | "paid";
  status: "upcoming" | "past";
  stats: {
    going: number;
    waitlist: number;
    canceled: number;
  };
};

type EventRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  startAt: Date;
  endAt: Date;
  capacity: number;
  priceCents: number;
  currency: string;
  visibility: boolean;
  rsvpDeadline: Date | null;
  venue: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueNotes: string | null;
  venueHiddenUntil: Date | null;
  createdAt: Date;
  details: string | null;
};

type EventRsvpRecord = {
  eventId: string;
  status: string;
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
  const countryParam = typeof searchParams.country === "string" ? searchParams.country : "all";
  const cityParam = typeof searchParams.city === "string" ? searchParams.city : "all";
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "all";
  const priceParam = typeof searchParams.price === "string" ? searchParams.price : "all";
  const dateFromParam = typeof searchParams.dateFrom === "string" ? searchParams.dateFrom : "";
  const dateToParam = typeof searchParams.dateTo === "string" ? searchParams.dateTo : "";
  const pageParam = Number.parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10);

  const sort = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
    ? (sortParam as (typeof SORT_OPTIONS)[number])
    : "start-desc";

  const events = (await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  })) as EventRecord[];

  const now = new Date();

  const decoratedEvents = events.map((event) => {
    const { city, country } = inferLocation(event);
    const category = inferEventCategory(event);
    const status: "upcoming" | "past" = event.endAt.getTime() >= now.getTime() ? "upcoming" : "past";
    const priceType: "free" | "paid" = event.priceCents > 0 ? "paid" : "free";
    const currency = (event.currency ?? "USD").toUpperCase();

    return {
      ...event,
      summary: event.summary ?? "",
      details: event.details ?? "",
      currency,
      locationCity: city,
      locationCountry: country,
      category,
      status,
      priceType,
    };
  });

  const countryOptions = Array.from(new Set(decoratedEvents.map((event) => event.locationCountry))).filter(Boolean);
  countryOptions.sort((a, b) => a.localeCompare(b));

  const cityOptions = getCityOptions(decoratedEvents, countryParam);

  const dateFrom = parseDateOnly(dateFromParam);
  const dateTo = parseDateOnly(dateToParam);
  const filtered = decoratedEvents.filter((event) => {
    if (query) {
      const haystack = `${event.name} ${event.summary ?? ""} ${event.details ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) {
        return false;
      }
    }
    if (visibilityParam === "public" && !event.visibility) return false;
    if (visibilityParam === "private" && event.visibility) return false;

    if (timeframeParam === "upcoming" && event.endAt.getTime() < now.getTime()) {
      return false;
    }
    if (timeframeParam === "past" && event.startAt.getTime() >= now.getTime()) {
      return false;
    }
    if (countryParam !== "all" && event.locationCountry !== countryParam) {
      return false;
    }
    if (cityParam !== "all" && event.locationCity !== cityParam) {
      return false;
    }
    if (typeParam !== "all" && event.category !== typeParam) {
      return false;
    }
    if (priceParam === "free" && event.priceType !== "free") {
      return false;
    }
    if (priceParam === "paid" && event.priceType !== "paid") {
      return false;
    }
    if (dateFrom && event.endAt.getTime() < dateFrom.getTime()) {
      return false;
    }
    if (dateTo) {
      const end = endOfDay(dateTo);
      if (event.startAt.getTime() > end.getTime()) {
        return false;
      }
    }
    return true;
  });

  const filteredEventIds = filtered.map((event) => event.id);
  const rsvps = filteredEventIds.length
    ? ((await prisma.eventRsvp.findMany({ where: { eventId: { in: filteredEventIds } } })) as EventRsvpRecord[])
    : [];

  const grouped = new Map<string, { going: number; waitlist: number; canceled: number }>();
  for (const event of filtered) {
    grouped.set(event.id, { going: 0, waitlist: 0, canceled: 0 });
  }
  for (const rsvp of rsvps) {
    const bucket = grouped.get(rsvp.eventId);
    if (!bucket) continue;
    if (rsvp.status === RsvpStatus.GOING) bucket.going += 1;
    if (rsvp.status === RsvpStatus.WAITLISTED) bucket.waitlist += 1;
    if (rsvp.status === RsvpStatus.CANCELED) bucket.canceled += 1;
  }

  const enhanced = filtered.map((event) => ({
    ...event,
    stats: grouped.get(event.id) ?? { going: 0, waitlist: 0, canceled: 0 },
  }));

  const sorted = enhanced.sort((a, b) => {
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

  const adminEvents: AdminEvent[] = pageEvents.map((event) => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    summary: event.summary ?? "",
    startAt: event.startAt,
    endAt: event.endAt,
    capacity: event.capacity,
    priceCents: event.priceCents,
    currency: event.currency,
    visibility: event.visibility,
    rsvpDeadline: event.rsvpDeadline,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    venueHiddenUntil: event.venueHiddenUntil,
    locationCity: event.locationCity,
    locationCountry: event.locationCountry,
    category: event.category,
    priceType: event.priceType,
    status: event.status,
    stats: event.stats,
  }));

  const upcomingEventsCount = enhanced.filter((event) => event.status === "upcoming").length;
  const pastEventsCount = enhanced.filter((event) => event.status === "past").length;
  const totalGoing = enhanced.reduce((sum, event) => sum + event.stats.going, 0);
  const totalWaitlist = enhanced.reduce((sum, event) => sum + event.stats.waitlist, 0);
  const projectedRevenueCents = enhanced.reduce((sum, event) => sum + event.stats.going * event.priceCents, 0);
  const averageFill = (() => {
    const relevant = enhanced.filter((event) => event.status === "upcoming" && event.capacity > 0);
    if (relevant.length === 0) return 0;
    const totalFill = relevant.reduce((sum, event) => sum + event.stats.going / event.capacity, 0);
    return totalFill / relevant.length;
  })();

  const categoryBreakdown = ["dating", "social"].map((type) => {
    const matching = enhanced.filter((event) => event.category === type);
    const attending = matching.reduce((sum, event) => sum + event.stats.going, 0);
    return {
      label: type === "dating" ? "Dating" : "Social",
      value: attending,
      context: `${matching.length} event${matching.length === 1 ? "" : "s"}`,
    };
  });

  const cityBreakdown = computeCityBreakdown(enhanced);

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Upcoming events"
          value={formatNumber(upcomingEventsCount)}
          description={pastEventsCount ? `${formatNumber(pastEventsCount)} past` : ""}
        />
        <MetricCard
          label="Confirmed attendees"
          value={formatNumber(totalGoing)}
          description={averageFill ? `${formatPercent(averageFill)} avg. capacity` : ""}
        />
        <MetricCard
          label="Waitlist"
          value={formatNumber(totalWaitlist)}
          description={totalGoing ? `${formatPercent(totalWaitlist / Math.max(totalGoing, 1))} of RSVP volume` : ""}
        />
        <MetricCard
          label="Projected revenue"
          value={formatCurrency(projectedRevenueCents)}
          description={totalGoing ? `${formatCurrency(Math.round(projectedRevenueCents / Math.max(totalGoing, 1)))} / attendee` : ""}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InsightCard
          title="Attendance by event type"
          description="Track where members are showing up most."
          items={categoryBreakdown}
        />
        <InsightCard
          title="Top cities"
          description="Largest RSVP counts by location."
          items={cityBreakdown}
        />
      </section>

      <EventsFilterForm
        defaultQuery={query}
        defaultVisibility={visibilityParam}
        defaultTimeframe={timeframeParam}
        defaultSort={sort}
        defaultCountry={countryParam}
        defaultCity={cityParam}
        defaultType={typeParam}
        defaultPrice={priceParam}
        defaultDateFrom={dateFromParam}
        defaultDateTo={dateToParam}
        countryOptions={countryOptions}
        cityOptions={cityOptions}
      />

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No events match these filters yet.
                </TableCell>
              </TableRow>
            ) : (
              adminEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.summary}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge
                          variant="outline"
                          className={
                            event.category === "dating"
                              ? "border-pink-500/40 bg-pink-500/10 text-pink-600"
                              : "border-sky-500/40 bg-sky-500/10 text-sky-600"
                          }
                        >
                          {event.category === "dating" ? "Dating" : "Social"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            event.status === "upcoming"
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                              : "border-slate-500/40 bg-slate-500/10 text-slate-600"
                          }
                        >
                          {event.status === "upcoming" ? "Upcoming" : "Completed"}
                        </Badge>
                        {event.visibility ? (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Ticket: {event.priceType === "free" ? "Free" : formatCurrency(event.priceCents, event.currency)} · Capacity {event.capacity}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <p>{formatDateRange(event.startAt, event.endAt)}</p>
                      {event.rsvpDeadline ? <p>RSVP by {formatDate(event.rsvpDeadline)}</p> : null}
                      {event.venueHiddenUntil ? <p>Reveal venue {formatDate(event.venueHiddenUntil)}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">
                        {event.locationCity}
                        {event.locationCountry && event.locationCountry !== "Unspecified"
                          ? `, ${event.locationCountry}`
                          : ""}
                      </p>
                      {event.venueName ? <p>{event.venueName}</p> : null}
                      {event.venueAddress ? <p>{event.venueAddress}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">{event.stats.going} going</p>
                      <div className="flex items-center gap-2">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-foreground/70"
                            style={{ width: `${Math.min(100, event.capacity ? (event.stats.going / event.capacity) * 100 : 0)}%` }}
                          />
                        </div>
                        <span>{event.capacity ? formatPercent(event.stats.going / event.capacity) : "–"}</span>
                      </div>
                      <p>
                        <span className="font-semibold text-foreground">Waitlist:</span> {event.stats.waitlist}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Canceled:</span> {event.stats.canceled}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">
                        {event.priceType === "free"
                          ? "Free to attend"
                          : `${formatCurrency(event.priceCents, event.currency)} / guest`}
                      </p>
                      {event.priceType === "paid" ? (
                        <p>Projected: {formatCurrency(event.priceCents * event.stats.going, event.currency)}</p>
                      ) : (
                        <p>Projected: —</p>
                      )}
                    </div>
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
          type: typeParam,
          price: priceParam,
          dateFrom: dateFromParam,
          dateTo: dateToParam,
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
  defaultType,
  defaultPrice,
  defaultDateFrom,
  defaultDateTo,
  countryOptions,
  cityOptions,
}: {
  defaultQuery: string;
  defaultVisibility: string;
  defaultTimeframe: string;
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultCountry: string;
  defaultCity: string;
  defaultType: string;
  defaultPrice: string;
  defaultDateFrom: string;
  defaultDateTo: string;
  countryOptions: string[];
  cityOptions: string[];
}) {
  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      method="get"
    >
      <div className="space-y-2">
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
          {countryOptions.map((country) => (
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
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="type" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Event type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaultType}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">Dating & social</option>
          <option value="dating">Dating</option>
          <option value="social">Social</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="visibility" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Listing
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
        <label htmlFor="price" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pricing
        </label>
        <select
          id="price"
          name="price"
          defaultValue={defaultPrice}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
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
        <label htmlFor="dateFrom" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Start date
        </label>
        <Input id="dateFrom" name="dateFrom" type="date" defaultValue={defaultDateFrom} className="h-11" />
      </div>
      <div className="space-y-2">
        <label htmlFor="dateTo" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          End date
        </label>
        <Input id="dateTo" name="dateTo" type="date" defaultValue={defaultDateTo} className="h-11" />
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

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="bg-card/80">
      <CardHeader className="gap-3">
        <CardDescription className="text-xs uppercase tracking-[0.3em]">{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
    </Card>
  );
}

type InsightItem = {
  label: string;
  value: number;
  context?: string;
};

function InsightCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: InsightItem[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{item.label}</span>
                <span>{formatNumber(item.value)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/70"
                  style={{ width: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
                />
              </div>
              {item.context ? <p className="text-xs text-muted-foreground">{item.context}</p> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
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

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

function inferLocation(event: Pick<EventRecord, "venue" | "venueName" | "venueAddress">) {
  const parts = event.venueAddress
    ? event.venueAddress
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

  let city = "Unspecified";
  let country = "Unspecified";

  if (parts.length >= 2) {
    city = parts[parts.length - 2];
    country = parts[parts.length - 1];
  } else if (parts.length === 1) {
    city = parts[0];
  } else if (event.venue) {
    city = event.venue;
  } else if (event.venueName) {
    city = event.venueName;
  }

  return { city, country };
}

function inferEventCategory(event: Pick<EventRecord, "summary" | "details">): "dating" | "social" {
  const haystack = `${event.summary ?? ""} ${event.details ?? ""}`.toLowerCase();
  if (/(date|dating|romance|match|salon)/.test(haystack)) {
    return "dating";
  }
  if (/(social|mixer|party|soiree|gathering|dinner)/.test(haystack)) {
    return "social";
  }
  return "dating";
}

function parseDateOnly(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function endOfDay(date: Date) {
  return new Date(date.getTime() + 1000 * 60 * 60 * 24 - 1);
}

function getCityOptions(
  events: (EventRecord & { locationCity: string; locationCountry: string })[],
  country: string,
) {
  const cities = events
    .filter((event) => country === "all" || event.locationCountry === country)
    .map((event) => event.locationCity)
    .filter(Boolean);
  const unique = Array.from(new Set(cities));
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
}

function computeCityBreakdown(
  events: { locationCity: string; locationCountry: string; stats: { going: number } }[],
) {
  const cityTotals = new Map<string, { going: number; events: number }>();
  for (const event of events) {
    const key = `${event.locationCity} • ${event.locationCountry}`;
    const bucket = cityTotals.get(key) ?? { going: 0, events: 0 };
    bucket.going += event.stats.going;
    bucket.events += 1;
    cityTotals.set(key, bucket);
  }
  const items: InsightItem[] = Array.from(cityTotals.entries())
    .map(([key, value]) => ({
      label: key,
      value: value.going,
      context: `${value.events} event${value.events === 1 ? "" : "s"}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  return items;
}
