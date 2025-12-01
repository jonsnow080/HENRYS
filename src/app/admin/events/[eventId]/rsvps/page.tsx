import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SITE_COPY } from "@/lib/site-copy";
import {
  sendArrivalSequenceAction,
  toggleNoShowAction,
  updateRsvpStatusAction,
} from "./actions";
import { buildStripeCustomerUrl } from "@/lib/stripe/dashboard";

const STATUS_FILTERS = ["all", RsvpStatus.GOING, RsvpStatus.WAITLISTED, RsvpStatus.CANCELED] as const;
type SearchParams = Record<string, string | string[] | undefined>;

type AdminRsvp = {
  id: string;
  status: RsvpStatus;
  noShow: boolean;
  attended: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  profile: {
    age?: number;
    vibe?: number;
    dietary?: string;
    dietaryNotes?: string;
  };
  seatGroup: {
    id: string;
    tableNumber: number;
  } | null;
  subscription: {
    stripeCustomerId: string;
    status: string;
  } | null;
  createdAt: Date;
};

export default async function EventRsvpsPage(props: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) {
    notFound();
  }

  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "all";
  const attendanceParam = typeof searchParams.attendance === "string" ? searchParams.attendance : "all";
  const seatGroupParam = typeof searchParams.seatGroup === "string" ? searchParams.seatGroup : "all";
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const rsvps = await prisma.eventRsvp.findMany({ where: { eventId: event.id } });
  const userIds: string[] = [];
  for (const rsvp of rsvps) {
    userIds.push(rsvp.userId);
  }
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const profiles = userIds.length
    ? await prisma.memberProfile.findMany({ where: { userId: { in: userIds } } })
    : [];
  const subscriptions = userIds.length
    ? await prisma.subscription.findMany({ where: { userId: { in: userIds } } })
    : [];
  const seatGroups = await prisma.seatGroup.findMany({ where: { eventId: event.id } });

  const userMap = new Map<string, (typeof users)[number]>();
  for (const user of users) {
    userMap.set(user.id, user);
  }
  const profileMap = new Map<string, (typeof profiles)[number]>();
  for (const profile of profiles) {
    profileMap.set(profile.userId, profile);
  }
  const seatGroupMap = new Map<string, (typeof seatGroups)[number]>();
  for (const group of seatGroups) {
    seatGroupMap.set(group.id, group);
  }
  const subscriptionMap = new Map<string, (typeof subscriptions)[number]>();
  for (const subscription of subscriptions) {
    subscriptionMap.set(subscription.userId, subscription);
  }

  const adminRsvps: AdminRsvp[] = [];
  for (const rsvp of rsvps) {
    const user = userMap.get(rsvp.userId);
    const profile = profileMap.get(rsvp.userId);
    const seatGroup = rsvp.seatGroupId ? seatGroupMap.get(rsvp.seatGroupId) : null;
    const subscription = subscriptionMap.get(rsvp.userId);
    adminRsvps.push({
      id: rsvp.id,
      status: rsvp.status as RsvpStatus,
      noShow: rsvp.noShow,
      attended: rsvp.attended,
      user: {
        id: rsvp.userId,
        name: typeof user?.name === "string" ? user.name : "Unknown",
        email: user?.email ?? "",
      },
      profile: {
        age: typeof profile?.age === "number" ? profile.age : undefined,
        vibe: typeof profile?.vibeEnergy === "number" ? profile.vibeEnergy : undefined,
        dietary: profile?.dietaryPreferences ?? undefined,
        dietaryNotes: profile?.dietaryNotes ?? undefined,
      },
      seatGroup: seatGroup
        ? {
          id: seatGroup.id,
          tableNumber: seatGroup.tableNumber,
        }
        : null,
      subscription: subscription
        ? {
          stripeCustomerId: subscription.stripeCustomerId,
          status: subscription.status,
        }
        : null,
      createdAt: rsvp.createdAt,
    });
  }

  const visibleRsvps = adminRsvps.filter((entry) => {
    if (query) {
      const haystack = `${entry.user.name} ${entry.user.email}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) {
        return false;
      }
    }
    if (statusParam !== "all" && entry.status !== statusParam) {
      return false;
    }
    if (attendanceParam === "no-show" && !entry.noShow) {
      return false;
    }
    if (attendanceParam === "attended" && !entry.attended) {
      return false;
    }
    if (seatGroupParam !== "all") {
      if (seatGroupParam === "unassigned" && entry.seatGroup) return false;
      if (seatGroupParam !== "unassigned" && entry.seatGroup?.id !== seatGroupParam) return false;
    }
    return true;
  });

  const stats = {
    total: adminRsvps.length,
    going: 0,
    waitlist: 0,
    canceled: 0,
    noShow: 0,
  };
  for (const entry of adminRsvps) {
    if (entry.status === RsvpStatus.GOING) stats.going += 1;
    if (entry.status === RsvpStatus.WAITLISTED) stats.waitlist += 1;
    if (entry.status === RsvpStatus.CANCELED) stats.canceled += 1;
    if (entry.noShow) stats.noShow += 1;
  }

  const exportUrl = `/admin/events/${event.id}/rsvps/export`;
  const redirectPath = buildRedirect(event.id, searchParams);
  const seatGroupOptions: { id: string; tableNumber: number }[] = [];
  for (const group of seatGroups) {
    seatGroupOptions.push({ id: group.id, tableNumber: group.tableNumber });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">RSVPs</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{event.name}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage the guest list, adjust statuses, and note no-shows to keep {SITE_COPY.name} hospitality sharp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-xs text-muted-foreground">
            <div>Total {stats.total}</div>
            <div>Going {stats.going} · Waitlist {stats.waitlist}</div>
            <div>No-shows {stats.noShow}</div>
          </div>
          <form action={sendArrivalSequenceAction} className="flex items-center gap-2">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="redirectTo" value={redirectPath} />
            <Button type="submit" variant="secondary" className="rounded-full">
              Send arrival sequence
            </Button>
          </form>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={exportUrl}>Export CSV</Link>
          </Button>
        </div>
      </header>

      <FilterForm
        defaultQuery={query}
        defaultStatus={statusParam}
        defaultAttendance={attendanceParam}
        defaultSeatGroup={seatGroupParam}
        eventId={event.id}
        seatGroups={seatGroupOptions}
      />

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRsvps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No RSVPs match these filters yet.
                </TableCell>
              </TableRow>
            ) : (
              visibleRsvps.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{entry.user.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                      {entry.seatGroup ? (
                        <Badge variant="outline" className="bg-muted text-xs">
                          Table {entry.seatGroup.tableNumber}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-xs text-muted-foreground">Unassigned</Badge>
                      )}
                      {entry.subscription ? (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="bg-muted text-[11px] uppercase tracking-wide">
                            Billing: {entry.subscription.status}
                          </Badge>
                          <Link
                            href={buildStripeCustomerUrl(entry.subscription.stripeCustomerId)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-foreground underline-offset-4 hover:underline"
                          >
                            Stripe customer
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {entry.profile.age ? <p>Age: {entry.profile.age}</p> : null}
                      {entry.profile.vibe ? <p>Vibe: {entry.profile.vibe}/10</p> : null}
                      {entry.profile.dietary ? <p>Dietary: {entry.profile.dietary}</p> : null}
                      {entry.profile.dietaryNotes ? <p>Notes: {entry.profile.dietaryNotes}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={entry.status} />
                      {entry.noShow ? (
                        <Badge variant="outline" className="border-destructive/50 text-destructive">
                          No-show
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={updateRsvpStatusAction}>
                        <input type="hidden" name="rsvpId" value={entry.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="redirectTo" value={redirectPath} />
                        <input type="hidden" name="status" value={RsvpStatus.GOING} />
                        <Button type="submit" size="sm" variant="outline" disabled={entry.status === RsvpStatus.GOING}>
                          Promote
                        </Button>
                      </form>
                      <form action={updateRsvpStatusAction}>
                        <input type="hidden" name="rsvpId" value={entry.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="redirectTo" value={redirectPath} />
                        <input type="hidden" name="status" value={RsvpStatus.WAITLISTED} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={entry.status === RsvpStatus.WAITLISTED}
                        >
                          Waitlist
                        </Button>
                      </form>
                      <form action={updateRsvpStatusAction}>
                        <input type="hidden" name="rsvpId" value={entry.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="redirectTo" value={redirectPath} />
                        <input type="hidden" name="status" value={RsvpStatus.CANCELED} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={entry.status === RsvpStatus.CANCELED}
                        >
                          Cancel
                        </Button>
                      </form>
                      <form action={toggleNoShowAction}>
                        <input type="hidden" name="rsvpId" value={entry.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="redirectTo" value={redirectPath} />
                        <Button type="submit" size="sm" variant={entry.noShow ? "outline" : "secondary"}>
                          {entry.noShow ? "Clear no-show" : "Mark no-show"}
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function buildRedirect(eventId: string, searchParams: SearchParams) {
  const params = new URLSearchParams();
  const keys = ["status", "attendance", "seatGroup", "q"] as const;
  for (const key of keys) {
    const value = searchParams[key];
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }
  return `/admin/events/${eventId}/rsvps${params.size ? `?${params.toString()}` : ""}`;
}

function StatusBadge({ status }: { status: RsvpStatus }) {
  if (status === RsvpStatus.GOING) {
    return <Badge className="bg-emerald-500/10 text-emerald-600">Going</Badge>;
  }
  if (status === RsvpStatus.WAITLISTED) {
    return <Badge className="bg-amber-500/10 text-amber-600">Waitlist</Badge>;
  }
  return <Badge variant="outline">Canceled</Badge>;
}

function FilterForm({
  defaultQuery,
  defaultStatus,
  defaultAttendance,
  defaultSeatGroup,
  seatGroups,
  eventId,
}: {
  defaultQuery: string;
  defaultStatus: string;
  defaultAttendance: string;
  defaultSeatGroup: string;
  eventId: string;
  seatGroups: { id: string; tableNumber: number }[];
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
        <Input id="q" name="q" placeholder="Name or email" defaultValue={defaultQuery} />
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
          {STATUS_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All" : option.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="attendance" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Attendance
        </label>
        <select
          id="attendance"
          name="attendance"
          defaultValue={defaultAttendance}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="no-show">No-show</option>
          <option value="attended">Checked-in</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="seatGroup" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Seat
        </label>
        <select
          id="seatGroup"
          name="seatGroup"
          defaultValue={defaultSeatGroup}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">All tables</option>
          <option value="unassigned">Unassigned</option>
          {seatGroups.map((group) => (
            <option key={group.id} value={group.id}>
              Table {group.tableNumber}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 px-6">
          Apply
        </Button>
        <Link
          href={`/admin/events/${eventId}/rsvps`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
