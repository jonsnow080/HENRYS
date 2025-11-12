import { NextRequest, NextResponse } from "next/server";
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
  const userIds: string[] = [];
  for (const rsvp of rsvps) {
    userIds.push(rsvp.userId);
  }
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : [];
  const profiles = userIds.length
    ? await prisma.memberProfile.findMany({ where: { userId: { in: userIds } } })
    : [];

  const userMap = new Map<string, (typeof users)[number]>();
  for (const user of users) {
    userMap.set(user.id, user);
  }
  const profileMap = new Map<string, (typeof profiles)[number]>();
  for (const profile of profiles) {
    profileMap.set(profile.userId, profile);
  }

  const sectionsParts: string[] = [];
  for (const group of seatGroups) {
    const assignments: typeof rsvps = [];
    for (const rsvp of rsvps) {
      if (rsvp.seatGroupId === group.id) {
        assignments.push(rsvp);
      }
    }

    const rowsParts: string[] = [];
    for (const rsvp of assignments) {
      const user = userMap.get(rsvp.userId);
      const profile = profileMap.get(rsvp.userId);
      const dietary = profile?.dietaryPreferences ?? "";
      const vibe = typeof profile?.vibeEnergy === "number" ? `${profile.vibeEnergy}/10` : "";
      rowsParts.push(
        `<tr><td>${user?.name ?? ""}</td><td>${user?.email ?? ""}</td><td>${dietary}</td><td>${vibe}</td></tr>`,
      );
    }

    const rowsHtml = rowsParts.join("");
    sectionsParts.push(`
        <section>
          <h2>Table ${group.tableNumber}</h2>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Dietary</th><th>Vibe</th></tr></thead>
            <tbody>${rowsHtml || "<tr><td colspan=4>Empty</td></tr>"}</tbody>
          </table>
        </section>
      `);
  }
  const sections = sectionsParts.join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${event.name} · Host sheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          p { margin-top: 0; color: #555; }
          section { margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
          th { background: #f7f7f7; text-align: left; }
        </style>
      </head>
      <body>
        <h1>${event.name} host sheet</h1>
        <p>${new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(event.startAt)} · Capacity ${event.capacity}</p>
        ${sections}
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
