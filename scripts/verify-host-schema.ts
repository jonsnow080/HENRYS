import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Host Schema...");

    const email = `test-host-${Date.now()}@example.com`;

    // 1. Test InviteCode creation
    const invite = await prisma.inviteCode.create({
        data: {
            code: crypto.randomUUID(),
            role: Role.HOST,
            email: "test@example.com",
            expiresAt: new Date(Date.now() + 100000),
        },
    });
    console.log("✅ InviteCode created with HOST role:", invite.id);
    if (invite.email !== "test@example.com") throw new Error("Invite email mismatch");

    // 2. Test User creation with HostProfile
    const user = await prisma.user.create({
        data: {
            email,
            role: Role.HOST,
            hostProfile: {
                create: {
                    availability: "Monday nights",
                    cities: ["New York"],
                },
            },
        },
        include: {
            hostProfile: true,
        },
    });

    if (user.role !== Role.HOST) throw new Error("User role not HOST");
    if (!user.hostProfile) throw new Error("HostProfile not created");
    if (user.hostProfile.availability !== "Monday nights") throw new Error("HostProfile availability mismatch");
    console.log("✅ User created with HostProfile:", user.id);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.inviteCode.delete({ where: { id: invite.id } });
    console.log("✅ Cleanup done");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
