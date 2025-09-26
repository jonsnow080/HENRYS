import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/server";
import { getBaseUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event || !event.visibility) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.priceCents <= 0) {
    return NextResponse.json({ error: "Event is complimentary" }, { status: 400 });
  }

  const stripe = getStripe();
  const baseUrl = getBaseUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/events/${event.id}?checkout=success`,
    cancel_url: `${baseUrl}/events/${event.id}?checkout=cancelled`,
    line_items: [
      {
        price_data: {
          currency: event.currency,
          product_data: {
            name: event.name,
            description: event.summary,
          },
          unit_amount: event.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "event",
      eventId: event.id,
      userId: session.user.id,
      description: `${event.name} ticket`,
    },
    payment_intent_data: {
      metadata: {
        eventId: event.id,
        userId: session.user.id,
        description: `${event.name} ticket`,
      },
    },
    custom_fields: [
      {
        key: "food_drink_ack",
        label: {
          type: "custom",
          custom: "I understand tickets/membership do not include food/drink",
        },
        type: "checkbox",
        checkbox: { required: true },
      },
    ],
    client_reference_id: `${event.id}:${session.user.id}`,
  });

  return NextResponse.json({ sessionId: checkoutSession.id });
}
