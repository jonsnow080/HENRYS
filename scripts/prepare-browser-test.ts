import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { Role } from "../src/lib/prisma-constants";

const prisma = new PrismaClient();

async function main() {
    const email = "test-dashboard@henrys.com";
    const password = "password123";
    const hashedPassword = await hash(password, 12);

    // User
    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hashedPassword, role: Role.MEMBER },
        create: {
            email,
            name: "Automated Tester",
            role: Role.MEMBER,
            passwordHash: hashedPassword,
        }
    });

    console.log(`User updated: ${email} / ${password}`);

    // Event
    const now = new Date();
    const galaStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const event = await prisma.event.upsert({
        where: { slug: "browser-test-gala" },
        update: { priceCents: 5000, startAt: galaStart },
        create: {
            slug: "browser-test-gala",
            name: "Browser Test Gala",
            summary: "Automation testing event",
            startAt: galaStart,
            endAt: new Date(galaStart.getTime() + 3 * 3600 * 1000),
            priceCents: 5000,
            currency: "usd",
        }
    });

    console.log(`Event updated: ${event.slug}`);

    // Clear previous RSVPs/Payments to ensure clean state
    await prisma.eventRsvp.deleteMany({ where: { userId: user.id, eventId: event.id } });
    // We can't easily delete Stripe payments from here, but our DB records we can
    await prisma.payment.deleteMany({ where: { userId: user.id, eventId: event.id } });

    console.log(`Event ready: http://localhost:3000/events/${event.slug}`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
