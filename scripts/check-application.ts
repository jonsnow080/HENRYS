
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkApplication() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    const applications = await prisma.application.findMany();
    console.log(`Found ${applications.length} applications in the database:`);
    applications.forEach(app => {
        console.log(`- ${app.fullName} (${app.email})`);
    });

    const email = "phineas.verified@gmail.com";
    console.log(`Checking for application with email: ${email} `);

    const application = await prisma.application.findFirst({
        where: { email },
        include: {
            applicant: {
                include: {
                    applicantProfile: true
                }
            }
        }
    });

    if (application) {
        console.log("Application found:");
        console.log(JSON.stringify(application, null, 2));
    } else {
        console.log("No application found.");
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            applicantProfile: true
        }
    });

    if (user) {
        console.log("User found:");
        console.log(JSON.stringify(user, null, 2));
    } else {
        console.log("No user found.");
    }

    const applicant = await prisma.applicant.findUnique({
        where: { email },
    });

    if (applicant) {
        console.log("Applicant found:");
        console.log(JSON.stringify(applicant, null, 2));
    } else {
        console.log("No applicant found.");
    }
}

checkApplication()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
