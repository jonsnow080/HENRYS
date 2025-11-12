import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateEventWizard } from "./create-event-wizard";

type SearchParams = Record<string, string | string[] | undefined>;

type EventRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
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
  startAt: Date;
  endAt: Date;
  capacity: number;
  priceCents: number;
  visibility: boolean;
  rsvpDeadline: Date | null;
  venueName: string | null;
  venueHiddenUntil: Date | null;
  createdAt: Date;
  locationCity: string;
  locationCountry: string;
  experienceType: "dating" | "social";
  status: "upcoming" | "past";
  revenueCents: number;
  fillRate: number;
  stats: {
    going: number;
    waitlist: number;
    canceled: number;
  };
};

const SORT_OPTIONS = ["start-desc", "start-asc", "name", "created"] as const;

const PAGE_SIZE = 8;

export const metadata: Metadata = {
  title: `Events · ${SITE_COPY.name}`,
  description: "Manage RSVPs, visibility, and logistics for upcoming gatherings.",
};

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

export default async function AdminEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "all";
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "start-desc";
  const pageParam = Number.parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10);
  const visibilityParam = typeof searchParams.visibility === "string" ? searchParams.visibility : "all";
  const countryParam = typeof searchParams.country === "string" ? searchParams.country : "all";
  const cityParam = typeof searchParams.city === "string" ? searchParams.city : "all";
  const experienceParam = typeof searchParams.experience === "string" ? searchParams.experience : "all";
  const priceParam = typeof searchParams.price === "string" ? searchParams.price : "all";
  const startDateParam = typeof searchParams.startDate === "string" ? searchParams.startDate : "";
  const endDateParam = typeof searchParams.endDate === "string" ? searchParams.endDate : "";

  const sort = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
    ? (sortParam as (typeof SORT_OPTIONS)[number])
    : "start-desc";

  const startDate = parseDateParam(startDateParam);
  const endDate = parseDateParam(endDateParam);

  const events = (await prisma.event.findMany({
    orderBy: { startAt: "desc" },
  })) as EventRecord[];

  const eventIds = events.map((event) => event.id);
  const rsvpRecords = eventIds.length
    ? ((await prisma.eventRsvp.findMany({ where: { eventId: { in: eventIds } } })) as EventRsvpRecord[])
    : [];

  const rsvpGroups = new Map<string, { going: number; waitlist: number; canceled: number }>();
  for (const event of events) {
    rsvpGroups.set(event.id, { going: 0, waitlist: 0, canceled: 0 });
  }
  for (const rsvp of rsvpRecords) {
    const bucket = rsvpGroups.get(rsvp.eventId);
    if (!bucket) continue;
    if (rsvp.status === RsvpStatus.GOING) bucket.going += 1;
    if (rsvp.status === RsvpStatus.WAITLISTED) bucket.waitlist += 1;
    if (rsvp.status === RsvpStatus.CANCELED) bucket.canceled += 1;
  }

  const now = new Date();
  const adminEvents: AdminEvent[] = events.map((event) => {
    const stats = rsvpGroups.get(event.id) ?? { going: 0, waitlist: 0, canceled: 0 };
    const location = extractLocation(event.venueName, event.venueAddress);
    const experienceType = classifyEventExperience(event);
    const status = event.endAt.getTime() >= now.getTime() ? "upcoming" : "past";
    const revenueCents = stats.going * event.priceCents;
    const fillRate = event.capacity > 0 ? Math.min(stats.going / event.capacity, 1) : 0;

    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      summary: event.summary ?? "",
      startAt: event.startAt,
      endAt: event.endAt,
      capacity: event.capacity,
      priceCents: event.priceCents,
      visibility: event.visibility,
      rsvpDeadline: event.rsvpDeadline,
      venueName: event.venueName,
      venueHiddenUntil: event.venueHiddenUntil,
      createdAt: event.createdAt,
      locationCity: location.city,
      locationCountry: location.country,
      experienceType,
      status,
      revenueCents,
      fillRate,
      stats,
    };
  });

  const countrySet = new Set<string>();
  let hasUnspecifiedCountry = false;
  for (const event of adminEvents) {
    if (event.locationCountry && event.locationCountry !== "Unspecified") {
      countrySet.add(event.locationCountry);
    } else {
      hasUnspecifiedCountry = true;
    }
  }
  const countryOptions = Array.from(countrySet).sort((a, b) => a.localeCompare(b));
  if (hasUnspecifiedCountry) {
    countryOptions.push("Unspecified");
  }

  const citySet = new Set<string>();
  let hasUnspecifiedCity = false;
  for (const event of adminEvents) {
    if (countryParam !== "all" && event.locationCountry !== countryParam) {
      continue;
    }
    if (event.locationCity && event.locationCity !== "Unspecified") {
      citySet.add(event.locationCity);
    } else {
      hasUnspecifiedCity = true;
    }
  }
  const cityOptions = Array.from(citySet).sort((a, b) => a.localeCompare(b));
  if (hasUnspecifiedCity) {
    cityOptions.push("Unspecified");
  }

  const filtered = adminEvents.filter((event) => {
    if (query) {
      const haystack = `${event.name} ${event.summary}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) {
        return false;
      }
    }
    if (statusParam === "upcoming" && event.status !== "upcoming") return false;
    if (statusParam === "past" && event.status !== "past") return false;
    if (visibilityParam === "public" && !event.visibility) return false;
    if (visibilityParam === "private" && event.visibility) return false;
    if (countryParam !== "all" && event.locationCountry !== countryParam) return false;
    if (cityParam !== "all" && event.locationCity !== cityParam) return false;
    if (experienceParam !== "all" && event.experienceType !== experienceParam) return false;
    if (priceParam === "paid" && event.priceCents === 0) return false;
    if (priceParam === "free" && event.priceCents > 0) return false;
    if (startDate && event.startAt < startDate) return false;
    if (endDate && event.startAt > endDate) return false;
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

  const statsSummary = buildStatsSummary(filtered);
  const experienceBreakdown = buildExperienceBreakdown(filtered);
  const momentum = buildMonthlyMomentum(filtered);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Events</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Host unforgettable nights</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track RSVPs, forecast demand, and surface insights across every HENRYS gathering.
          </p>
        </div>
        <CreateEventWizard />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Upcoming events" value={statsSummary.upcomingEvents} helper="On the calendar" />
        <MetricTile label="Past events" value={statsSummary.pastEvents} helper="Already hosted" />
        <MetricTile
          label="Confirmed RSVPs"
          value={statsSummary.confirmedRsvps}
          helper="Across selected events"
        />
        <MetricTile
          label="Avg. capacity fill"
          value={statsSummary.averageFillRate}
          helper="Confirmed vs. capacity"
          format="percentage"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MomentumCard data={momentum} totalEvents={filtered.length} />
        <ExperienceCard breakdown={experienceBreakdown} />
      </section>

      <EventsFilterForm
        defaultQuery={query}
        defaultStatus={statusParam}
        defaultVisibility={visibilityParam}
        defaultSort={sort}
        defaultCountry={countryParam}
        defaultCity={cityParam}
        defaultExperience={experienceParam}
        defaultPrice={priceParam}
        defaultStartDate={startDateParam}
        defaultEndDate={endDateParam}
        countryOptions={countryOptions}
        cityOptions={cityOptions}
      />

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Event</TableHead>
              <TableHead className="min-w-[180px]">Schedule</TableHead>
              <TableHead className="min-w-[160px]">Location</TableHead>
              <TableHead className="min-w-[160px]">RSVPs</TableHead>
              <TableHead className="min-w-[200px]">Performance</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No events match these filters yet.
                </TableCell>
              </TableRow>
            ) : (
              pageEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{event.name}</p>
                        <Badge variant="outline" className={experienceBadgeClass(event.experienceType)}>
                          {event.experienceType === "dating" ? "Dating" : "Social"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.summary}</p>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Ticket: {formatCurrency(event.priceCents)} · Capacity {event.capacity}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{formatDateRange(event.startAt, event.endAt)}</p>
                      <p className="flex items-center gap-2">
                        <StatusDot status={event.status} />
                        <span className="capitalize">{event.status}</span>
                      </p>
                      {event.rsvpDeadline ? <p>RSVP by {formatDate(event.rsvpDeadline)}</p> : null}
                      {event.venueHiddenUntil ? <p>Reveal venue {formatDate(event.venueHiddenUntil)}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="text-sm font-semibold text-foreground">{event.locationCity}</p>
                      <p>{event.locationCountry}</p>
                      {event.venueName ? <p className="text-[11px] text-muted-foreground">{event.venueName}</p> : null}
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
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fill rate</p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground/80"
                            style={{ width: `${Math.round(event.fillRate * 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {Math.round(event.fillRate * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Revenue</p>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(event.revenueCents)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Visibility</p>
                        {event.visibility ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                            Hidden
                          </Badge>
                        )}
                      </div>
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
          q: query || undefined,
          status: statusParam,
          sort,
          visibility: visibilityParam,
          country: countryParam,
          city: cityParam,
          experience: experienceParam,
          price: priceParam,
          startDate: startDateParam || undefined,
          endDate: endDateParam || undefined,
        }}
      />
    </div>
  );
}

function EventsFilterForm({
  defaultQuery,
  defaultStatus,
  defaultVisibility,
  defaultSort,
  defaultCountry,
  defaultCity,
  defaultExperience,
  defaultPrice,
  defaultStartDate,
  defaultEndDate,
  countryOptions,
  cityOptions,
}: {
  defaultQuery: string;
  defaultStatus: string;
  defaultVisibility: string;
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultCountry: string;
  defaultCity: string;
  defaultExperience: string;
  defaultPrice: string;
  defaultStartDate: string;
  defaultEndDate: string;
  countryOptions: string[];
  cityOptions: string[];
}) {
  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
      method="get"
    >
      <div className="space-y-2">
        <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <Input id="q" name="q" placeholder="Name or summary" defaultValue={defaultQuery} />
      </div>
      <div className="space-y-2">
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultStatus}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
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
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Hidden</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="experience" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Experience
        </label>
        <select
          id="experience"
          name="experience"
          defaultValue={defaultExperience}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="dating">Dating events</option>
          <option value="social">Social events</option>
        </select>
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
          <option value="all">All</option>
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
          <option value="all">All</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
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
          <option value="paid">Paid only</option>
          <option value="free">Complimentary</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Start after
        </label>
        <Input id="startDate" name="startDate" type="date" defaultValue={defaultStartDate} />
      </div>
      <div className="space-y-2">
        <label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Start before
        </label>
        <Input id="endDate" name="endDate" type="date" defaultValue={defaultEndDate} />
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
  baseSearchParams: Record<string, string | undefined>;
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

function MetricTile({
  label,
  value,
  helper,
  format = "number",
}: {
  label: string;
  value: number;
  helper: string;
  format?: "number" | "percentage";
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold">
        {format === "percentage" ? `${value}%` : value.toLocaleString("en-US")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function MomentumCard({ data, totalEvents }: { data: { label: string; value: number }[]; totalEvents: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-border/60 bg-card/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Momentum</p>
          <h2 className="text-lg font-semibold">Events by month</h2>
        </div>
        <Badge variant="outline" className="rounded-full bg-foreground/5 text-xs">
          {totalEvents} total
        </Badge>
      </div>
      {data.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center text-sm text-muted-foreground">
          No events in this range yet. Adjust filters to explore more data.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {data.map((entry) => (
            <div key={entry.label} className="flex flex-col gap-2">
              <div className="flex h-28 flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-3">
                <div className="flex h-full items-end justify-center">
                  <span className="inline-flex w-8 rounded-full bg-primary/70" style={{ height: barHeight(entry.value, data) }} />
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">{entry.value}</p>
                <p>{entry.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceCard({
  breakdown,
}: {
  breakdown: { dating: number; social: number };
}) {
  const total = breakdown.dating + breakdown.social;
  const datingPercent = total === 0 ? 0 : Math.round((breakdown.dating / total) * 100);
  const socialPercent = total === 0 ? 0 : 100 - datingPercent;

  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-border/60 bg-card/70 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Experience mix</p>
        <h2 className="text-lg font-semibold">Dating vs. social</h2>
      </div>
      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center text-sm text-muted-foreground">
          No events available for this breakdown.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Dating events</span>
              <span>{datingPercent}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-rose-500/80" style={{ width: `${datingPercent}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{breakdown.dating.toLocaleString("en-US")} events</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Social events</span>
              <span>{socialPercent}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-sky-500/80" style={{ width: `${socialPercent}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{breakdown.social.toLocaleString("en-US")} events</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: "upcoming" | "past" }) {
  return (
    <span
      className={cn(
        "inline-flex h-2 w-2 rounded-full",
        status === "upcoming" ? "bg-emerald-500" : "bg-muted-foreground/50",
      )}
      aria-hidden="true"
    />
  );
}

function experienceBadgeClass(type: "dating" | "social") {
  return cn(
    "border-transparent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
    type === "dating" ? "bg-rose-500/10 text-rose-600" : "bg-sky-500/10 text-sky-600",
  );
}

function extractLocation(venueName: string | null, venueAddress: string | null): {
  city: string;
  country: string;
} {
  if (!venueAddress && !venueName) {
    return { city: "Unspecified", country: "Unspecified" };
  }

  const segments = (venueAddress ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length >= 3) {
    const city = segments[segments.length - 2];
    const country = segments[segments.length - 1];
    return {
      city: city || venueName || "Unspecified",
      country: country || "Unspecified",
    };
  }

  if (segments.length === 2) {
    const first = segments[0];
    const second = segments[1];
    if (looksLikeCountry(second)) {
      return { city: first || venueName || "Unspecified", country: second || "Unspecified" };
    }
    return { city: second || venueName || "Unspecified", country: first || "Unspecified" };
  }

  if (segments.length === 1) {
    return { city: segments[0] || venueName || "Unspecified", country: "Unspecified" };
  }

  return { city: venueName || "Unspecified", country: "Unspecified" };
}

function looksLikeCountry(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  const known = new Set([
    "united kingdom",
    "uk",
    "united states",
    "usa",
    "canada",
    "france",
    "germany",
    "spain",
    "italy",
    "ireland",
    "australia",
    "singapore",
    "hong kong",
  ]);
  if (known.has(normalized)) return true;
  if (/^[A-Z]{2,3}$/.test(value)) return true;
  if (value.length <= 3) return true;
  return false;
}

function classifyEventExperience(event: EventRecord): "dating" | "social" {
  const haystack = `${event.name} ${event.summary ?? ""}`.toLowerCase();
  const datingKeywords = ["dating", "match", "romance", "connection", "pairs"];
  for (const keyword of datingKeywords) {
    if (haystack.includes(keyword)) {
      return "dating";
    }
  }
  return "social";
}

function buildStatsSummary(events: AdminEvent[]) {
  const upcomingEvents = events.filter((event) => event.status === "upcoming").length;
  const pastEvents = events.filter((event) => event.status === "past").length;
  const confirmedRsvps = events.reduce((total, event) => total + event.stats.going, 0);
  const totalCapacity = events.reduce((total, event) => total + event.capacity, 0);
  const averageFillRate = totalCapacity === 0 ? 0 : Math.min(100, Math.round((confirmedRsvps / totalCapacity) * 100));

  return {
    upcomingEvents,
    pastEvents,
    confirmedRsvps,
    averageFillRate,
  };
}

function buildExperienceBreakdown(events: AdminEvent[]) {
  let dating = 0;
  let social = 0;
  for (const event of events) {
    if (event.experienceType === "dating") dating += 1;
    else social += 1;
  }
  return { dating, social };
}

function buildMonthlyMomentum(events: AdminEvent[]) {
  const counts = new Map<string, { label: string; value: number; time: number }>();
  for (const event of events) {
    const monthKey = `${event.startAt.getFullYear()}-${event.startAt.getMonth()}`;
    if (!counts.has(monthKey)) {
      counts.set(monthKey, {
        label: monthLabelFormatter.format(event.startAt),
        value: 0,
        time: event.startAt.getTime(),
      });
    }
    const entry = counts.get(monthKey)!;
    entry.value += 1;
  }
  const ordered = Array.from(counts.values()).sort((a, b) => a.time - b.time);
  return ordered.slice(-6);
}

function barHeight(value: number, data: { value: number }[]) {
  const maxValue = data.reduce((max, entry) => Math.max(max, entry.value), 0);
  if (maxValue === 0) return "10%";
  const percent = Math.max((value / maxValue) * 100, 10);
  return `${percent}%`;
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

function parseDateParam(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
