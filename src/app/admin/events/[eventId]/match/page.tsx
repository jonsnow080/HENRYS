import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { SITE_COPY } from "@/lib/site-copy";
import { SeatingPlanner } from "./planner";

export default async function SeatingMatchPage({ params }: { params: { eventId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) {
    notFound();
  }

  const seatGroups = await prisma.seatGroup.findMany({
    where: { eventId: event.id },
    orderBy: { tableNumber: "asc" },
  });

  const rsvps = await prisma.eventRsvp.findMany({ where: { eventId: event.id } });
  const goingRsvps: typeof rsvps = [];
  const userIds: string[] = [];
  for (const rsvp of rsvps) {
    userIds.push(rsvp.userId);
    if (rsvp.status === RsvpStatus.GOING) {
      goingRsvps.push(rsvp);
    }
  }
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const profiles = userIds.length
    ? await prisma.memberProfile.findMany({ where: { userId_in: userIds } })
    : [];

  const userMap = new Map<string, (typeof users)[number]>();
  for (const user of users) {
    userMap.set(user.id, user);
  }
  const profileMap = new Map<string, (typeof profiles)[number]>();
  for (const profile of profiles) {
    profileMap.set(profile.userId, profile);
  }

  const attendees: {
    id: string;
    userId: string;
    name: string;
    email: string;
    seatGroupId: string | null;
    age?: number;
    vibe?: number;
    dietary?: string;
    dietaryNotes?: string;
    dontPairWithIds: string[];
  }[] = [];
  for (const rsvp of goingRsvps) {
    const user = userMap.get(rsvp.userId);
    const profile = profileMap.get(rsvp.userId);
    const data = (profile?.data ?? {}) as Record<string, unknown>;
    const preferences = (rsvp.preferences ?? {}) as { dontPairWithIds?: string[] };
    attendees.push({
      id: rsvp.id,
      userId: rsvp.userId,
      name: user?.name ?? "Unknown guest",
      email: user?.email ?? "",
      seatGroupId: rsvp.seatGroupId,
      age: typeof data.age === "number" ? data.age : undefined,
      vibe: typeof data.vibeEnergy === "number" ? (data.vibeEnergy as number) : undefined,
      dietary: typeof data.dietaryPreferences === "string" ? (data.dietaryPreferences as string) : undefined,
      dietaryNotes: typeof data.dietaryNotes === "string" ? (data.dietaryNotes as string) : undefined,
      dontPairWithIds: Array.isArray(preferences.dontPairWithIds)
        ? (preferences.dontPairWithIds as string[])
        : [],
    });
  }

  const seatGroupSummaries: { id: string; tableNumber: number; capacity: number }[] = [];
  for (const group of seatGroups) {
    seatGroupSummaries.push({ id: group.id, tableNumber: group.tableNumber, capacity: group.capacity });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Seating match</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{event.name}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Pair guests to maximize serendipity. Drag attendees into tables, auto-suggest new mixes, and log every change for the
          {" "}
          {SITE_COPY.name} ops archive.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/events/${event.id}/match/export`}
            className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:border-border hover:text-foreground"
          >
            Export CSV
          </a>
          <a
            href={`/admin/events/${event.id}/match/host-sheet`}
            className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:border-border hover:text-foreground"
          >
            Host sheet
          </a>
        </div>
      </header>

      <SeatingPlanner eventId={event.id} attendees={attendees} seatGroups={seatGroupSummaries} />
    </div>
  );
}
