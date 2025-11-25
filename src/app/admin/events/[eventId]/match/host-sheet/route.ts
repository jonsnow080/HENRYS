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
  const unassigned = rsvps.filter((rsvp) => !rsvp.seatGroupId);
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

    const openSeats = Math.max(group.capacity - assignments.length, 0);

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
          <div class="table-heading">
            <h2>Table ${group.tableNumber}</h2>
            <p class="muted">${assignments.length}/${group.capacity} seated · ${openSeats} seats open</p>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Dietary</th><th>Vibe</th></tr></thead>
            <tbody>${rowsHtml || "<tr><td colspan=4>Empty</td></tr>"}</tbody>
          </table>
        </section>
      `);
  }
  const unassignedRows = unassigned
    .map((rsvp) => {
      const user = userMap.get(rsvp.userId);
      const profile = profileMap.get(rsvp.userId);
      const dietary = profile?.dietaryPreferences ?? "";
      const vibe = typeof profile?.vibeEnergy === "number" ? `${profile.vibeEnergy}/10` : "";
      return `<tr><td>${user?.name ?? ""}</td><td>${user?.email ?? ""}</td><td>${dietary}</td><td>${vibe}</td></tr>`;
    })
    .join("");
  const sections = sectionsParts.join("");
  const unassignedSection = `
    <section>
      <div class="table-heading">
        <h2>Unassigned & last-minute</h2>
        <p class="muted">${unassigned.length} guest${unassigned.length === 1 ? "" : "s"} awaiting seats</p>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Dietary</th><th>Vibe</th></tr></thead>
        <tbody>${unassignedRows || "<tr><td colspan=4>No pending guests</td></tr>"}</tbody>
      </table>
    </section>
  `;
  const totalCapacity = seatGroups.reduce((sum, group) => sum + group.capacity, 0);
  const seatedCount = rsvps.length - unassigned.length;
  const availableSeats = Math.max(totalCapacity - seatedCount, 0);

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${event.name} · Host sheet</title>
        <style>
          :root { color: #0f172a; }
          body { font-family: "Inter", system-ui, -apple-system, sans-serif; margin: 32px; color: #0f172a; background: #fafafa; }
          main { max-width: 960px; margin: 0 auto; }
          h1 { font-size: 30px; margin-bottom: 6px; letter-spacing: -0.01em; }
          p { margin-top: 0; color: #475569; }
          .muted { color: #64748b; font-size: 14px; }
          section { margin-top: 28px; padding: 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05); }
          .table-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
          h2 { font-size: 18px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 14px; }
          th { background: #f8fafc; text-align: left; letter-spacing: 0.02em; color: #0f172a; }
          tbody tr:nth-child(odd) td { background: #f8fafc; }
          tbody tr td { vertical-align: top; }
          .meta { display: inline-flex; gap: 12px; flex-wrap: wrap; font-size: 14px; color: #334155; }
          .callout { background: #ecfeff; border: 1px solid #0ea5e9; color: #0ea5e9; padding: 10px 12px; border-radius: 12px; font-size: 14px; }
          @media print {
            body { margin: 18mm; background: #fff; }
            section { break-inside: avoid; box-shadow: none; }
            .callout { border-color: #0f172a; color: #0f172a; }
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <h1>${event.name} host sheet</h1>
            <div class="meta">
              <span>${new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(event.startAt)}</span>
              <span>Capacity ${event.capacity}</span>
              <span>${seatedCount} seated · ${availableSeats} open seats</span>
            </div>
            <div class="callout" role="status">Drag from the unassigned list as guests arrive, or mark no-shows directly in the planner.</div>
          </header>
          ${unassignedSection}
          ${sections}
        </main>
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
