import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { RsvpStatus } from "@/lib/prisma-constants";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PromoteWaitlistButton } from "./_components/promote-waitlist-button";

type AdminRsvp = {
  id: string;
  userId: string;
  eventId: string;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
  promotionHoldUntil: Date | null;
};

function formatHold(holdUntil: Date | null) {
  if (!holdUntil) return "—";
  const now = new Date();
  if (holdUntil <= now) {
    return "Expired";
  }
  return `On hold until ${formatDate(holdUntil)}`;
}

export default async function AdminEventRsvpsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) {
    notFound();
  }

  const rsvps = (await prisma.eventRsvp.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
  })) as AdminRsvp[];

  const userCache = new Map<string, { name: string | null; email: string }>();
  for (const rsvp of rsvps) {
    if (userCache.has(rsvp.userId)) continue;
    const user = await prisma.user.findUnique({ where: { id: rsvp.userId } });
    if (user) {
      userCache.set(user.id, { name: user.name, email: user.email });
    }
  }

  const going = rsvps.filter((entry) => entry.status === RsvpStatus.GOING);
  const waitlist = rsvps.filter((entry) => entry.status === RsvpStatus.WAITLISTED);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">RSVP queue · {event.name}</h1>
        <p className="text-sm text-muted-foreground">
          Track confirmed guests, see who&apos;s waiting in line, and manually promote the next member if needed. The waitlist is ordered by RSVP timestamp.
        </p>
        <p className="text-sm text-muted-foreground">Event starts {formatDate(event.startAt)}.</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Waitlist queue</h2>
            <p className="text-sm text-muted-foreground">
              Automatic promotions happen when someone cancels before the RSVP deadline. Use the button to override.
            </p>
          </div>
          <PromoteWaitlistButton eventId={event.id} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitlist.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Waitlist is currently empty.
                </TableCell>
              </TableRow>
            ) : (
              waitlist.map((entry, index) => {
                const user = userCache.get(entry.userId);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          #{index + 1} · {user?.name ?? user?.email ?? "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">{user?.email ?? "Unknown email"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(entry.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatHold(entry.promotionHoldUntil ?? null)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableCaption>Promotion attempts set a 30 minute hold before automatically moving to the next person.</TableCaption>
        </Table>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Confirmed guests</h2>
          <p className="text-sm text-muted-foreground">Includes everyone marked as going via checkout or manual promotion.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>RSVP&apos;d</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {going.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No confirmed RSVPs yet.
                </TableCell>
              </TableRow>
            ) : (
              going.map((entry) => {
                const user = userCache.get(entry.userId);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.name ?? user?.email ?? "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{user?.email ?? "Unknown email"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(entry.updatedAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
