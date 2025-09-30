import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const memberEmail = "rileyhaase090@gmail.com";
  const password = "temppass";
  const passwordHash = await hashPassword(password);

  const plans = [
    {
      name: "Founding Monthly",
      stripePriceId:
        process.env.STRIPE_FOUNDING_MONTHLY_PRICE_ID ?? "price_founding_monthly",
      perks: ["Priority RSVPs", "Members-only salons", "Invite credits"],
    },
    {
      name: "Founding Annual",
      stripePriceId:
        process.env.STRIPE_FOUNDING_ANNUAL_PRICE_ID ?? "price_founding_annual",
      perks: [
        "Priority RSVPs",
        "Guest invitations",
        "Founders' supper",
        "Concierge introductions",
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { stripePriceId: plan.stripePriceId },
      update: {
        name: plan.name,
        perksJSON: plan.perks,
      },
      create: {
        name: plan.name,
        stripePriceId: plan.stripePriceId,
        perksJSON: plan.perks,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: memberEmail },
    update: {
      passwordHash,
      role: Role.MEMBER,
      emailVerified: new Date(),
      name: "Riley Haase",
    },
    create: {
      email: memberEmail,
      passwordHash,
      role: Role.MEMBER,
      emailVerified: new Date(),
      name: "Riley Haase",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
