import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";

import { CreateEventWizard } from "./create-event-wizard";

export const metadata: Metadata = {
  title: `Events · ${SITE_COPY.name}`,
  description: "Manage RSVPs, visibility, and logistics for upcoming gatherings.",
};

type SearchParams = Record<string, string | string[] | undefined>;

type EventRsvpRecord = {
  status: string;
};

type PrismaEventRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  details: string | null;
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
  createdAt: Date;
  rsvps: EventRsvpRecord[];
};

type DecoratedEvent = {
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
  venueHiddenUntil: Date | null;
  stats: {
    going: number;
    waitlist: number;
    canceled: number;
  };
  createdAt: Date;
  location: {
    city: string | null;
    country: string | null;
    label: string | null;
  };
  category: "dating" | "social";
  projectedRevenueCents: number;
  fillRate: number;
  timeframe: "upcoming" | "past";
};

const SORT_OPTIONS = ["start-desc", "start-asc", "name", "created", "fill-desc", "fill-asc"] as const;

const PAGE_SIZE = 10;

export default async function AdminEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const visibilityParam = typeof searchParams.visibility === "string" ? searchParams.visibility : "all";
  const timeframeParam = typeof searchParams.timeframe === "string" ? searchParams.timeframe : "upcoming";
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "start-desc";
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "both";
  const priceParam = typeof searchParams.price === "string" ? searchParams.price : "all";
  const countryParam = typeof searchParams.country === "string" ? searchParams.country : "all";
  const cityParam = typeof searchParams.city === "string" ? searchParams.city : "all";
  const startParam = typeof searchParams.start === "string" ? searchParams.start : "";
  const endParam = typeof searchParams.end === "string" ? searchParams.end : "";
  const pageParam = Number.parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10);

  const sort = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
    ? (sortParam as (typeof SORT_OPTIONS)[number])
    : "start-desc";

  const events = (await prisma.event.findMany({
    orderBy: { startAt: "asc" },
    include: { rsvps: { select: { status: true } } },
  })) as PrismaEventRecord[];

  const now = new Date();

  const decoratedEvents: DecoratedEvent[] = events.map((event) => {
    const stats = event.rsvps.reduce(
      (acc, rsvp) => {
        if (rsvp.status === RsvpStatus.GOING) acc.going += 1;
        if (rsvp.status === RsvpStatus.WAITLISTED) acc.waitlist += 1;
        if (rsvp.status === RsvpStatus.CANCELED) acc.canceled += 1;
        return acc;
      },
      { going: 0, waitlist: 0, canceled: 0 },
    );

    const location = deriveLocation(event.venueAddress ?? null, event.venueName ?? null);
    const category = inferCategory(event.summary ?? "", event.details ?? "");
    const timeframe = event.endAt.getTime() >= now.getTime() ? "upcoming" : "past";
    const projectedRevenueCents = stats.going * event.priceCents;
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
      currency: event.currency,
      visibility: event.visibility,
      rsvpDeadline: event.rsvpDeadline,
      venueName: event.venueName,
      venueHiddenUntil: event.venueHiddenUntil,
      stats,
      createdAt: event.createdAt,
      location,
      category,
      projectedRevenueCents,
      fillRate,
      timeframe,
    };
  });

  const startDate = startParam ? startOfDay(startParam) : null;
  const endDate = endParam ? endOfDay(endParam) : null;

  const filteredEvents = decoratedEvents.filter((event) => {
    if (query) {
      const haystack = `${event.name} ${event.summary}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) {
        return false;
      }
    }

    if (visibilityParam === "public" && !event.visibility) return false;
    if (visibilityParam === "private" && event.visibility) return false;

    if (timeframeParam === "upcoming" && event.timeframe !== "upcoming") return false;
    if (timeframeParam === "past" && event.timeframe !== "past") return false;

    if (typeParam === "dating" && event.category !== "dating") return false;
    if (typeParam === "social" && event.category !== "social") return false;

    if (priceParam === "free" && event.priceCents > 0) return false;
    if (priceParam === "paid" && event.priceCents === 0) return false;

    if (countryParam !== "all") {
      if (countryParam === "unknown" && event.location.country) {
        return false;
      }
      if (
        countryParam !== "unknown" &&
        (!event.location.country || slugify(event.location.country) !== countryParam)
      ) {
        return false;
      }
    }

    if (cityParam !== "all") {
      if (cityParam === "unknown" && event.location.city) {
        return false;
      }
      if (cityParam !== "unknown" && (!event.location.city || slugify(event.location.city) !== cityParam)) {
        return false;
      }
    }

    if (startDate && event.startAt.getTime() < startDate.getTime()) return false;
    if (endDate && event.startAt.getTime() > endDate.getTime()) return false;

    return true;
  });

  const sortedEvents = filteredEvents.sort((a, b) => {
    if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sort === "created") {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (sort === "start-asc") {
      return a.startAt.getTime() - b.startAt.getTime();
    }
    if (sort === "fill-desc") {
      return b.fillRate - a.fillRate;
    }
    if (sort === "fill-asc") {
      return a.fillRate - b.fillRate;
    }
    if (sort === "start-desc") {
      return b.startAt.getTime() - a.startAt.getTime();
    }
    return a.startAt.getTime() - b.startAt.getTime();
  });

  const total = sortedEvents.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(pageParam || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEvents = sortedEvents.slice(startIndex, startIndex + PAGE_SIZE);

  const metrics = buildMetrics(filteredEvents);
  const countryOptions = buildLocationOptions(decoratedEvents.map((event) => event.location.country));
  const cityOptions = buildLocationOptions(decoratedEvents.map((event) => event.location.city));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Events</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Steer the events calendar</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track RSVPs, understand momentum, and keep upcoming gatherings sharp.
          </p>
        </div>
        <CreateEventWizard />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-[0.2em] text-[11px] text-muted-foreground">
                {metric.label}
              </CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
            {metric.caption ? (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{metric.caption}</p>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </section>

      <EventsFilterForm
        defaultQuery={query}
        defaultVisibility={visibilityParam}
        defaultTimeframe={timeframeParam}
        defaultSort={sort}
        defaultType={typeParam}
        defaultPrice={priceParam}
        defaultCountry={countryParam}
        defaultCity={cityParam}
        defaultStart={startParam}
        defaultEnd={endParam}
        countryOptions={countryOptions}
        cityOptions={cityOptions}
      />

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
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
                <TableRow key={event.id} className="align-top">
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full border-border/60 bg-background/80">
                          {titleCase(event.category)} event
                        </Badge>
                        <Badge
                          variant="outline"
                          className={event.timeframe === "upcoming" ? "rounded-full border-emerald-500/50 bg-emerald-500/10 text-emerald-600" : "rounded-full border-muted-foreground/40 bg-muted text-muted-foreground"}
                        >
                          {event.timeframe === "upcoming" ? "Upcoming" : "Past"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={event.visibility ? "rounded-full border-emerald-500/50 bg-emerald-500/10 text-emerald-600" : "rounded-full border-amber-500/50 bg-amber-500/10 text-amber-600"}
                        >
                          {event.visibility ? "Public" : "Hidden"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{event.name}</p>
                        {event.summary ? (
                          <p className="text-xs text-muted-foreground">{event.summary}</p>
                        ) : null}
                      </div>
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
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {event.location.label ? <p>{event.location.label}</p> : <p>—</p>}
                      {event.venueName ? <p>{event.venueName}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-semibold text-foreground">Confirmed:</span> {event.stats.going} / {event.capacity}
                        {event.capacity > 0 ? ` (${Math.round(event.fillRate * 100)}%)` : ""}
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
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Ticket {formatCurrency(event.priceCents, event.currency)}</p>
                      <p>Projected {formatCurrency(event.projectedRevenueCents, event.currency)}</p>
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
          type: typeParam,
          price: priceParam,
          country: countryParam,
          city: cityParam,
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
  defaultType,
  defaultPrice,
  defaultCountry,
  defaultCity,
  defaultStart,
  defaultEnd,
  countryOptions,
  cityOptions,
}: {
  defaultQuery: string;
  defaultVisibility: string;
  defaultTimeframe: string;
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultType: string;
  defaultPrice: string;
  defaultCountry: string;
  defaultCity: string;
  defaultStart: string;
  defaultEnd: string;
  countryOptions: { value: string; label: string }[];
  cityOptions: { value: string; label: string }[];
}) {
  return (
    <form className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6" method="get">
      <input type="hidden" name="page" value="1" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Search">
          <Input id="q" name="q" placeholder="Name or summary" defaultValue={defaultQuery} />
        </FormField>
        <FormField label="Timeframe">
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
        </FormField>
        <FormField label="Sort">
          <select id="sort" name="sort" defaultValue={defaultSort} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="start-desc">Start date ↓</option>
            <option value="start-asc">Start date ↑</option>
            <option value="name">Name A→Z</option>
            <option value="created">Recently created</option>
            <option value="fill-desc">Fill rate ↓</option>
            <option value="fill-asc">Fill rate ↑</option>
          </select>
        </FormField>
        <FormField label="Visibility">
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
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Event focus">
          <select
            id="type"
            name="type"
            defaultValue={defaultType}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="both">Dating + social</option>
            <option value="dating">Dating</option>
            <option value="social">Social</option>
          </select>
        </FormField>
        <FormField label="Ticket type">
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
        </FormField>
        <FormField label="Country">
          <select
            id="country"
            name="country"
            defaultValue={defaultCountry}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="unknown">Unknown</option>
          </select>
        </FormField>
        <FormField label="City">
          <select
            id="city"
            name="city"
            defaultValue={defaultCity}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            {cityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="unknown">Unknown</option>
          </select>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
        <FormField label="Start date">
          <Input id="start" name="start" type="date" defaultValue={defaultStart} />
        </FormField>
        <FormField label="End date">
          <Input id="end" name="end" type="date" defaultValue={defaultEnd} />
        </FormField>
        <div className="flex items-end gap-2 justify-end lg:justify-start">
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
      </div>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <span>{label}</span>
      <div className="text-foreground">{children}</div>
    </label>
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

function buildMetrics(events: DecoratedEvent[]) {
  const upcoming = events.filter((event) => event.timeframe === "upcoming");
  const past = events.filter((event) => event.timeframe === "past");

  const upcomingCount = upcoming.length;
  const pastCount = past.length;
  const confirmedGuests = events.reduce((acc, event) => acc + event.stats.going, 0);
  const waitlistGuests = events.reduce((acc, event) => acc + event.stats.waitlist, 0);
  const projectedRevenueCents = upcoming.reduce((acc, event) => acc + event.projectedRevenueCents, 0);
  const revenueCurrency = resolveSharedCurrency(upcoming);
  const fallbackCurrency = revenueCurrency ?? resolveSharedCurrency(events) ?? "USD";

  const pastFillRate = past.length
    ? Math.round((past.reduce((acc, event) => acc + event.fillRate, 0) / past.length) * 100)
    : 0;

  return [
    {
      label: "Upcoming",
      value: upcomingCount.toString(),
      caption: upcomingCount === 1 ? "Event on the books" : "Events on the books",
    },
    {
      label: "Past",
      value: pastCount.toString(),
      caption: pastCount === 1 ? "Event hosted" : "Events hosted",
    },
    {
      label: "Confirmed guests",
      value: confirmedGuests.toString(),
      caption: waitlistGuests ? `${waitlistGuests} on the waitlist` : undefined,
    },
    {
      label: "Projected revenue",
      value:
        revenueCurrency === null && upcoming.length > 0
          ? "Mixed currencies"
          : formatCurrency(projectedRevenueCents, fallbackCurrency),
      caption:
        revenueCurrency === null && upcoming.length > 0
          ? "Revenue spans multiple currencies"
          : past.length
            ? `Avg past fill ${pastFillRate}%`
            : undefined,
    },
  ];
}

function resolveSharedCurrency(events: DecoratedEvent[]) {
  const currencies = new Set(events.map((event) => event.currency.toUpperCase()));
  if (currencies.size === 0) return null;
  if (currencies.size > 1) return null;
  const [currency] = Array.from(currencies);
  return currency ?? null;
}

function deriveLocation(address: string | null, fallbackLabel?: string | null) {
  if (!address) {
    const fallback = fallbackLabel ? { city: fallbackLabel, country: null, label: fallbackLabel } : null;
    return fallback ?? { city: null, country: null, label: null };
  }
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    const fallback = fallbackLabel ? { city: fallbackLabel, country: null, label: fallbackLabel } : null;
    return fallback ?? { city: null, country: null, label: null };
  }

  let city: string | null = null;
  let country: string | null = null;

  if (parts.length === 1) {
    city = parts[0];
  } else if (parts.length === 2) {
    city = parts[1];
  } else {
    city = parts[parts.length - 2];
    country = parts[parts.length - 1];
  }

  if (!city && fallbackLabel) {
    city = fallbackLabel;
  }

  const label = [city, country].filter(Boolean).join(", ") || fallbackLabel || null;

  return { city, country, label };
}

function inferCategory(summary: string, details: string) {
  const haystack = `${summary} ${details}`.toLowerCase();
  const datingKeywords = ["dating", "match", "chemistry", "pair", "slow dating"];
  if (datingKeywords.some((keyword) => haystack.includes(keyword))) {
    return "dating" as const;
  }
  return "social" as const;
}

function buildLocationOptions(values: (string | null)[]) {
  const unique = new Map<string, string>();
  for (const value of values) {
    if (!value) continue;
    const key = slugify(value);
    if (!unique.has(key)) {
      unique.set(key, value);
    }
  }
  return Array.from(unique.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function startOfDay(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: string) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDateRange(start: Date, end: Date) {
  const startFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
  const endFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });
  return `${startFormatter.format(start)} → ${endFormatter.format(end)}`;
}

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
