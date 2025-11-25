import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatEventDateTime, formatPrice } from "@/lib/intl/formatters";
import { resolveIntlConfig, type IntlConfig } from "@/lib/intl/resolveIntlConfig";
import { RsvpStatus } from "@/lib/prisma-constants";
import { Button } from "@/components/ui/button";

type Event = Awaited<ReturnType<typeof prisma.event.findMany>>[number];
type EventRsvp = Awaited<ReturnType<typeof prisma.eventRsvp.findMany>>[number];

export const metadata: Metadata = {
  title: "Events",
};

const EVENT_GALLERY = [
  {
    src: "/images/event-gallery/date-night-toast.svg",
    alt: "Two glasses clinking during a candlelit salon",
  },
  {
    src: "/images/event-gallery/rooftop-soiree.svg",
    alt: "Guests mingling at a rooftop gathering at dusk",
  },
  {
    src: "/images/event-gallery/speakeasy-lounge.svg",
    alt: "Live jazz filling an intimate speakeasy lounge",
  },
  {
    src: "/images/event-gallery/supper-club.svg",
    alt: "A long supper club table set for an evening salon",
  },
] as const;

const EVENT_CARD_IMAGE_SIZES = "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw";

type GenderBucket = "female" | "male" | "other";

function getGalleryImage(event: Event) {
  const key = (event.slug ?? event.id ?? "").toString();
  const total = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return EVENT_GALLERY[total % EVENT_GALLERY.length];
}

function extractGender(preferences: EventRsvp["preferences"]): GenderBucket | null {
  if (!preferences || typeof preferences !== "object") {
    return null;
  }

  const record = preferences as Record<string, unknown>;
  const raw = record.genderIdentity ?? record.gender ?? record.pronouns;

  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.toLowerCase();

  if (/(female|woman|she)/.test(normalized)) {
    return "female";
  }

  if (/(male|man|he)/.test(normalized)) {
    return "male";
  }

  if (normalized.trim().length > 0) {
    return "other";
  }

  return null;
}

function summarizeGenderRatio(rsvps: EventRsvp[]) {
  const tallies: Record<GenderBucket, number> = {
    female: 0,
    male: 0,
    other: 0,
  };

  for (const rsvp of rsvps) {
    const gender = extractGender(rsvp.preferences);
    if (gender) {
      tallies[gender] += 1;
    }
  }

  if (tallies.female === 0 && tallies.male === 0 && tallies.other === 0) {
    return "Balanced mix";
  }

  const baseRatio = `${tallies.female}:${tallies.male}`;
  return tallies.other > 0 ? `${baseRatio} (+${tallies.other} non-binary)` : baseRatio;
}

function renderEventGrid(
  title: string,
  emptyCopy: string,
  events: Event[],
  rsvpMap: Map<string, EventRsvp[]>,
  highlight: "past" | "upcoming",
  intlConfig: IntlConfig,
) {
  if (events.length === 0) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{highlight}</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        </header>
        <div className="rounded-3xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
          {emptyCopy}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{highlight}</p>
        <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const image = getGalleryImage(event);
          const going = rsvpMap.get(event.id) ?? [];
          const attendeeCount = going.length;
          const attendeeLabel = attendeeCount > 0 ? `${attendeeCount} going` : "Seats available";
          const genderRatio = summarizeGenderRatio(going);
          const location = event.venueName ?? event.venue ?? "Location shared with attendees";
          const priceLabel =
            event.priceCents > 0
              ? formatPrice({ amountMinor: event.priceCents, currencyOverride: event.currency, intlConfig })
              : "Complimentary";
          const eventDateLabels = formatEventDateTime({
            start: event.startAt,
            end: event.endAt,
            intlConfig,
          });

          return (
            <article
              key={event.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] w-full bg-muted">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes={EVENT_CARD_IMAGE_SIZES}
                />
              </div>
              <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{eventDateLabels.list}</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground">
                      {highlight === "upcoming" ? "Upcoming" : "Past"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-foreground">{event.name}</h3>
                    {event.summary ? <p className="text-sm text-muted-foreground">{event.summary}</p> : null}
                  </div>
                </div>
                <dl className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-medium text-foreground">Location</dt>
                    <dd className="text-right">{location}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-medium text-foreground">Attendees</dt>
                    <dd className="text-right">{attendeeLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-medium text-foreground">Gender ratio</dt>
                    <dd className="text-right">{genderRatio}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{priceLabel}</span>
                  <Button asChild size="sm">
                    <Link href={`/events/${event.id}`}>View details</Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function EventsPage() {
  const events: Event[] = await prisma.event.findMany({
    where: { visibility: true },
    orderBy: { startAt: "asc" },
  });

  const goingRsvps: EventRsvp[] = await prisma.eventRsvp.findMany({
    where: {
      status: { in: [RsvpStatus.GOING] },
    },
  });

  const rsvpMap = new Map<string, EventRsvp[]>();
  for (const event of events) {
    rsvpMap.set(event.id, []);
  }
  for (const rsvp of goingRsvps) {
    const bucket = rsvpMap.get(rsvp.eventId);
    if (bucket) {
      bucket.push(rsvp);
    }
  }

  const now = new Date();
  const upcoming = events
    .filter((event) => event.startAt.getTime() >= now.getTime())
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const past = events
    .filter((event) => event.startAt.getTime() < now.getTime())
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());

  const intlConfig = resolveIntlConfig();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-4 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Curated gatherings</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Explore HENRYS events</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          Our salons blend conversation, craft cocktails, and extraordinary humans. Browse upcoming experiences and revisit past
          highlights to see where we’ve been.
        </p>
      </header>

      {renderEventGrid(
        "Upcoming events",
        "We’re crafting the next slate of salons. Check back soon to reserve your seat.",
        upcoming,
        rsvpMap,
        "upcoming",
        intlConfig,
      )}

      {renderEventGrid(
        "Past events",
        "Want to host something similar? Reach out to the team and we’ll help you plan it.",
        past,
        rsvpMap,
        "past",
        intlConfig,
      )}
    </div>
  );
}
