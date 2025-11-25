import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { paymentReceiptTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentId } = (await request.json().catch(() => null)) ?? {};
  if (typeof paymentId !== "string") {
    return NextResponse.json({ error: "Missing payment" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      event: { select: { name: true } },
      user: { select: { email: true } },
    },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let description = payment.description ?? "";
  if (!description && payment.event) {
    description = `${payment.event.name} ticket`;
  }

  if (!description) {
    const subscription = await prisma.subscription.findFirst({ where: { userId: payment.userId } });
    if (subscription) {
      const plan = await prisma.membershipPlan.findUnique({ where: { id: subscription.planId } });
      description = plan ? `${plan.name} membership` : "Membership billing";
    }
  }

  if (!description) {
    description = "Receipt";
  }

  const prettyAmount = formatCurrency(payment.amount, payment.currency);
  const recipient = session.user.email ?? payment.user?.email;
  if (!recipient) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  await sendEmail({
    to: recipient,
    subject: `Receipt · ${prettyAmount}`,
    mjml: paymentReceiptTemplate({
      amount: prettyAmount,
      description,
      receiptUrl: payment.receiptUrl ?? undefined,
    }),
    text: `${description} — ${prettyAmount}`,
    tags: [
      { name: "category", value: "payment" },
      { name: "payment_id", value: payment.id },
    ],
  });

  return NextResponse.json({ ok: true });
}
