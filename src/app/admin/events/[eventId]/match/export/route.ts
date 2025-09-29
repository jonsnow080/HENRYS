import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return new NextResponse("Not found", { status: 404 });
  }

  const seatGroups = await prisma.seatGroup.findMany({
    where: { eventId: event.id },
    orderBy: { tableNumber: "asc" },
  });
  const rsvps = await prisma.eventRsvp.findMany({ where: { eventId: event.id, status: RsvpStatus.GOING } });
  const userIds = rsvps.map((rsvp) => rsvp.userId);
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const rows = ["Table,Name,Email"];
  for (const group of seatGroups) {
    const assignments = rsvps.filter((rsvp) => rsvp.seatGroupId === group.id);
    if (assignments.length === 0) {
      rows.push(`${group.tableNumber},,,`);
      continue;
    }
    for (const rsvp of assignments) {
      const user = userMap.get(rsvp.userId);
      const name = user?.name ?? "";
      const email = user?.email ?? "";
      rows.push(
        [group.tableNumber, name, email]
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      );
    }
  }

  const body = rows.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=event-${event.slug}-seating.csv`,
    },
  });
}
