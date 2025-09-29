import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/server";
import { sendEmail } from "@/lib/email/send";
import { getBaseUrl } from "@/lib/utils";
import { promoteNextWaitlistedRsvp } from "@/lib/events/promotion";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  try {
    const result = await promoteNextWaitlistedRsvp(params.eventId, {
      prisma,
      stripe,
      sendEmail,
      getBaseUrl,
    });
    return NextResponse.json({ status: result.status });
  } catch (error) {
    console.error("Manual promotion failed", error);
    return NextResponse.json({ error: "Promotion failed" }, { status: 500 });
  }
}
