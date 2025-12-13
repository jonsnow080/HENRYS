
import { PrismaClient } from "@prisma/client";
import { RsvpStatus, Role } from "../src/lib/prisma-constants";

const prisma = new PrismaClient();

async function main() {
    const email = "test-dashboard@henrys.com";
    console.log(`Seeding data for ${email}...`);

    // 1. Create/Update User
    const user = await prisma.user.upsert({
        where: { email },
        update: { role: Role.MEMBER },
        create: {
            email,
            name: "Dashboard Tester",
            role: Role.MEMBER,
        },
    });

    console.log(`User ID: ${user.id}`);

    const now = new Date();

    // 2. Clear existing RSVPs for this user to avoid conflicts if re-run
    await prisma.eventRsvp.deleteMany({
        where: { userId: user.id }
    });

    // 3. Create Events

    // Event A: Refundable (Upcoming > 24h)
    const galaStart = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48h
    const gala = await prisma.event.upsert({
        where: { slug: "test-gala-refundable" },
        update: { startAt: galaStart, endAt: new Date(galaStart.getTime() + 3 * 3600 * 1000) },
        create: {
            slug: "test-gala-refundable",
            name: "Grand Gala (Refundable)",
            summary: "A test event more than 24h away.",
            startAt: galaStart,
            endAt: new Date(galaStart.getTime() + 3 * 3600 * 1000),
            priceCents: 5000,
            currency: "usd",
        },
    });

    // Event B: Late Cancel (Upcoming < 24h)
    const mixerStart = new Date(now.getTime() + 12 * 60 * 60 * 1000); // +12h
    const mixer = await prisma.event.upsert({
        where: { slug: "test-mixer-late" },
        update: { startAt: mixerStart, endAt: new Date(mixerStart.getTime() + 3 * 3600 * 1000) },
        create: {
            slug: "test-mixer-late",
            name: "Last Minute Mixer (Penalty)",
            summary: "A test event less than 24h away.",
            startAt: mixerStart,
            endAt: new Date(mixerStart.getTime() + 3 * 3600 * 1000),
            priceCents: 0, // Member event
        },
    });

    // Event C: Past Event
    const pastStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // -48h
    const pastEvent = await prisma.event.upsert({
        where: { slug: "test-past-soiree" },
        update: { startAt: pastStart, endAt: new Date(pastStart.getTime() + 3 * 3600 * 1000) },
        create: {
            slug: "test-past-soiree",
            name: "Past Soiree",
            summary: "A memory from the past.",
            startAt: pastStart,
            endAt: new Date(pastStart.getTime() + 3 * 3600 * 1000),
            priceCents: 2000,
        },
    });

    // 4. Create RSVPs
    await prisma.eventRsvp.create({
        data: {
            userId: user.id,
            eventId: gala.id,
            status: RsvpStatus.GOING,
        },
    });

    // Fake Payment for Gala
    await prisma.payment.create({
        data: {
            userId: user.id,
            eventId: gala.id,
            amount: 5000,
            currency: "usd",
            status: "succeeded",
            stripePaymentIntentId: "pi_fake_123456",
            description: "Gala Ticket",
        }
    });

    await prisma.eventRsvp.create({
        data: {
            userId: user.id,
            eventId: mixer.id,
            status: RsvpStatus.GOING,
        },
    });
    // No payment for mixer (member access)

    await prisma.eventRsvp.create({
        data: {
            userId: user.id,
            eventId: pastEvent.id,
            status: RsvpStatus.GOING,
            attended: true,
        },
    });

    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
