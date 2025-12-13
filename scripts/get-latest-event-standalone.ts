import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const event = await prisma.event.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true }
    });
    console.log(JSON.stringify(event));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
