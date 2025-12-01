import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address.");
        process.exit(1);
    }

    console.log(`Checking for applicant with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            applicantProfile: true,
            applications: true,
        },
    });

    if (!user) {
        console.log("No User found.");
    } else {
        console.log("User found:", JSON.stringify(user, null, 2));
    }

    const applicant = await prisma.applicant.findUnique({
        where: { email },
    });

    if (!applicant) {
        console.log("No Applicant found.");
    } else {
        console.log("Applicant found:", JSON.stringify(applicant, null, 2));
    }

    const application = await prisma.application.findFirst({
        where: { email },
    });

    if (!application) {
        console.log("No Application found.");
    } else {
        console.log("Application found:", JSON.stringify(application, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
