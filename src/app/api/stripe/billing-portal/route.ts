import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/server";
import { getBaseUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["active", "trialing", "past_due"] },
    },
  });

  if (!activeSubscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription" }, { status: 400 });
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: activeSubscription.stripeCustomerId,
    return_url: `${getBaseUrl()}/dashboard?billing=return`,
  });

  return NextResponse.json({ url: portalSession.url });
}
