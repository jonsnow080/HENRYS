import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
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

  const rsvps = await prisma.eventRsvp.findMany({ where: { eventId: event.id } });
  const userIds: string[] = [];
  for (const rsvp of rsvps) {
    userIds.push(rsvp.userId);
  }
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];

  const userMap = new Map<string, (typeof users)[number]>();
  for (const user of users) {
    userMap.set(user.id, user);
  }

  const rows = ["Name,Email,Status,NoShow,SeatGroup" ];
  for (const rsvp of rsvps) {
    const user = userMap.get(rsvp.userId);
    const name = user?.name ?? "";
    const email = user?.email ?? "";
    const seat = rsvp.seatGroupId ?? "";
    rows.push(
      [name, email, rsvp.status, rsvp.noShow ? "YES" : "", seat]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
  }

  const body = rows.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=event-${event.slug}-rsvps.csv`,
    },
  });
}
