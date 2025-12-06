import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding hosts...");

    const hostsData = [
        { name: "Alice Host", email: "alice@henrys.com" },
        { name: "Bob Host", email: "bob@henrys.com" },
        { name: "Charlie Host", email: "charlie@henrys.com" },
        { name: "Diana Host", email: "diana@henrys.com" },
        { name: "Evan Host", email: "evan@henrys.com" },
    ];

    for (const hostData of hostsData) {
        const user = await prisma.user.upsert({
            where: { email: hostData.email },
            update: { role: Role.HOST },
            create: {
                email: hostData.email,
                name: hostData.name,
                role: Role.HOST,
            },
        });

        console.log(`Created/Updated host: ${user.name}`);

        // Create some events for this host
        const numEvents = Math.floor(Math.random() * 5) + 3; // 3-7 events
        for (let i = 0; i < numEvents; i++) {
            const isPast = Math.random() > 0.4;
            const daysOffset = Math.floor(Math.random() * 60) - 30; // +/- 30 days
            const startAt = new Date();
            startAt.setDate(startAt.getDate() + (isPast ? -Math.abs(daysOffset) : Math.abs(daysOffset)));
            const endAt = new Date(startAt);
            endAt.setHours(endAt.getHours() + 3);

            const event = await prisma.event.create({
                data: {
                    slug: `${(user.name ?? "host").toLowerCase().replace(" ", "-")}-event-${i}-${Date.now()}`,
                    name: `${user.name ?? "Host"}'s ${isPast ? "Past" : "Upcoming"} Event ${i + 1}`,
                    summary: "A great event for testing.",
                    startAt,
                    endAt,
                    hostId: user.id,
                    priceCents: 2000, // $20
                    capacity: 50,
                },
            });

            // Create some payments for this event
            const numPayments = Math.floor(Math.random() * 20);
            for (let j = 0; j < numPayments; j++) {
                await prisma.payment.create({
                    data: {
                        userId: user.id, // Self-paying for simplicity, or could link to random users
                        eventId: event.id,
                        amount: 2000,
                        currency: "usd",
                        status: "succeeded",
                        stripePaymentIntentId: `pi_${event.id}_${j}`,
                    },
                });
            }
        }
    }

    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
