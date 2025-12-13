import { prisma } from "../src/lib/prisma";

async function main() {
    const event = await prisma.event.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true }
    });
    console.log(JSON.stringify(event));
}

main();
