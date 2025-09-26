import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
