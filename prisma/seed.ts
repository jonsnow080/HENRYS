import { PrismaClient } from "@prisma/client";
import { ApplicationStatus } from "../src/lib/prisma-constants";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Standard",
      stripePriceId: process.env.STRIPE_STANDARD_PRICE_ID ?? "price_standard",
      perks: ["1 event per month", "Community access"],
      monthlyEventLimit: 1,
      includesMatchmaking: false,
    },
    {
      name: "Unlimited",
      stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID ?? "price_unlimited",
      perks: ["Unlimited events", "Priority RSVPs", "Community access"],
      monthlyEventLimit: null,
      includesMatchmaking: false,
    },
    {
      name: "VIP",
      stripePriceId: process.env.STRIPE_VIP_PRICE_ID ?? "price_vip",
      perks: [
        "Unlimited events",
        "Handpicked match suggestions",
        "Priority RSVPs",
        "Founders' supper",
      ],
      monthlyEventLimit: null,
      includesMatchmaking: true,
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { stripePriceId: plan.stripePriceId },
      update: {
        name: plan.name,
        perksJSON: plan.perks,
        monthlyEventLimit: plan.monthlyEventLimit,
        includesMatchmaking: plan.includesMatchmaking,
      },
      create: {
        name: plan.name,
        stripePriceId: plan.stripePriceId,
        perksJSON: plan.perks,
        monthlyEventLimit: plan.monthlyEventLimit,
        includesMatchmaking: plan.includesMatchmaking,
      },
    });
  }

  const carouselImages = [
    {
      imageUrl: "https://images.unsplash.com/photo-1529634898388-84d0fb4fb9b8?auto=format&fit=crop&w=1024&q=80",
      altText: "Couple clinking cocktails at a candlelit bar table.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1024&q=80",
      altText: "Friends laughing together in a vibrant lounge.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1544075571-21005b86c60c?auto=format&fit=crop&w=1024&q=80",
      altText: "Couple sharing a toast in a dimly lit speakeasy.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1024&q=80",
      altText: "Elegant pair posing beside the bar lights.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1024&q=80",
      altText: "Group of friends sharing dinner and wine.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1024&q=80",
      altText: "Couple enjoying cocktails at a rooftop party.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1024&q=80",
      altText: "Stylish guests mingling in a neon bar.",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=1024&q=80",
      altText: "Smiling couple leaning in over candlelight.",
    },
  ];

  const existingCarouselImages = await prisma.homepageCarouselImage.count();
  if (existingCarouselImages === 0) {
    for (const [index, image] of carouselImages.entries()) {
      await prisma.homepageCarouselImage.create({
        data: {
          imageUrl: image.imageUrl,
          altText: image.altText,
          isVisible: true,
          sortOrder: index + 1,
        },
      });
    }
  }

  const now = Date.now();
  const fakeApplications = [
    {
      fullName: "Aisha Gomez",
      email: "aisha.gomez@gmail.com",
      status: ApplicationStatus.SUBMITTED,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      payload: {
        fullName: "Aisha Gomez",
        email: "aisha.gomez@gmail.com",
        age: 29,
        city: "New York, NY",
        occupation: "Product designer",
        linkedin: "https://www.linkedin.com/in/aishagomez",
        instagram: "https://www.instagram.com/aishago",
        motivation:
          "I'm searching for a thoughtful community that loves ideas and bringing people together for deep conversations.",
        threeWords: "Curious, warm, creative",
        perfectSaturday:
          "Slow brunch with friends, gallery hopping in Chelsea, and ending with a dinner party I host at home.",
        dietary: "Pescatarian",
        dietaryNotes: null,
        alcohol: "Wine with dinner",
        vibe: 7,
        availability: "Most Thursday evenings",
        dealBreakers: ["Smoking"],
        consentCode: true,
        consentData: true,
      },
    },
    {
      fullName: "Marcus Lee",
      email: "marcus.lee@gmail.com",
      status: ApplicationStatus.IN_REVIEW,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
      notes: "Promising connector with strong hospitality background.",
      payload: {
        fullName: "Marcus Lee",
        email: "marcus.lee@gmail.com",
        age: 34,
        city: "Brooklyn, NY",
        occupation: "Experience designer",
        linkedin: "https://www.linkedin.com/in/marcuslee",
        instagram: "https://www.instagram.com/marcusmakes",
        motivation:
          "I'd love to help shape salons that explore creativity and entrepreneurship with a generous spirit.",
        threeWords: "Empathetic, resourceful, playful",
        perfectSaturday:
          "Morning basketball in Fort Greene, afternoon studio visits, and a supper club I run with friends.",
        dietary: null,
        dietaryNotes: null,
        alcohol: "Craft cocktails",
        vibe: 8,
        availability: "Weeknights except Wednesdays",
        dealBreakers: ["Poor communication"],
        consentCode: true,
        consentData: true,
      },
    },
    {
      fullName: "Priya Natarajan",
      email: "priya.natarajan@gmail.com",
      status: ApplicationStatus.WAITLIST,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7),
      notes: "Great storyteller — consider for future arts-focused salon.",
      payload: {
        fullName: "Priya Natarajan",
        email: "priya.natarajan@gmail.com",
        age: 31,
        city: "Jersey City, NJ",
        occupation: "Film producer",
        linkedin: "https://www.linkedin.com/in/priyanatarajan",
        instagram: "https://www.instagram.com/priya.directs",
        motivation:
          "I want to join a community that values purposeful connection and supports ambitious creative projects.",
        threeWords: "Vibrant, thoughtful, ambitious",
        perfectSaturday:
          "Yoga, scouting a new location for a shoot, and cooking something elaborate with my partner and friends.",
        dietary: "Vegetarian",
        dietaryNotes: "Avoid mushrooms",
        alcohol: "Sparkling wine",
        vibe: 6,
        availability: "Weekends and Monday nights",
        dealBreakers: ["No long-term vision"],
        consentCode: true,
        consentData: true,
      },
    },
    {
      fullName: "Elliot Chen",
      email: "elliot.chen@gmail.com",
      status: ApplicationStatus.APPROVED,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 9),
      notes: "Ready for onboarding — invite sent in manual testing.",
      payload: {
        fullName: "Elliot Chen",
        email: "elliot.chen@gmail.com",
        age: 28,
        city: "New York, NY",
        occupation: "Software founder",
        linkedin: "https://www.linkedin.com/in/elliotchen",
        instagram: "https://www.instagram.com/elliot.codes",
        motivation:
          "I'm looking to swap big ideas with peers who are equally excited about technology, hospitality, and culture.",
        threeWords: "Analytical, generous, calm",
        perfectSaturday:
          "Cycling up the Hudson, getting lost in a bookstore, then cooking a multi-course meal for friends.",
        dietary: null,
        dietaryNotes: null,
        alcohol: "Natural wine",
        vibe: 5,
        availability: "Flexible with notice",
        dealBreakers: ["Heavy drinking", "Smoking"],
        consentCode: true,
        consentData: true,
      },
    },
    {
      fullName: "Sofia Ramirez",
      email: "sofia.ramirez@gmail.com",
      status: ApplicationStatus.REJECTED,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
      notes: "Encourage to reapply once schedule opens up.",
      payload: {
        fullName: "Sofia Ramirez",
        email: "sofia.ramirez@gmail.com",
        age: 27,
        city: "Hoboken, NJ",
        occupation: "Strategy consultant",
        linkedin: "https://www.linkedin.com/in/sofiaramirez",
        instagram: "https://www.instagram.com/sofialately",
        motivation:
          "I want to deepen friendships with curious people who love designing meaningful gatherings.",
        threeWords: "Energetic, organized, optimistic",
        perfectSaturday:
          "Pilates, volunteering at a community garden, and hosting a themed dinner party in the evening.",
        dietary: "Gluten-free",
        dietaryNotes: "Cross-contamination sensitive",
        alcohol: "Tequila spritz",
        vibe: 9,
        availability: "Traveling most of Q2",
        dealBreakers: ["Political extremes"],
        consentCode: true,
        consentData: true,
      },
    },
  ];

  for (const application of fakeApplications) {
    const existing = await prisma.application.findFirst({
      where: { email: application.email },
    });

    if (existing) {
      continue;
    }

    await prisma.application.create({
      data: {
        email: application.email,
        fullName: application.fullName,
        status: application.status,
        createdAt: application.createdAt,
        notes: application.notes,
        payload: application.payload,
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
