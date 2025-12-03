import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    if (!process.env.DATABASE_URL?.startsWith("postgres")) {
        console.log("Skipping admin fix: DATABASE_URL not found or invalid.");
        return;
    }

    const email = "rileyhaase090@gmail.com";

    console.log(`Checking user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.warn(`User with email ${email} not found. Skipping admin promotion.`);
        return;
    }

    if (user.role === Role.ADMIN) {
        console.log(`User ${email} is already an ADMIN.`);
        return;
    }

    console.log(`Promoting ${email} to ADMIN...`);

    await prisma.user.update({
        where: { email },
        data: { role: Role.ADMIN },
    });

    console.log(`Successfully promoted ${email} to ADMIN.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
