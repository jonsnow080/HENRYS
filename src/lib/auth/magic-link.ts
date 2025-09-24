import crypto from "node:crypto";
import { prisma } from "../prisma";
import { sendEmail } from "../email/send";
import { magicLinkTemplate } from "../email/templates";
import { SITE_COPY } from "../site-copy";

const TOKEN_TTL_MINUTES = 15;

export async function createMagicLink({
  email,
  redirectTo,
  sendEmailNotification = true,
}: {
  email: string;
  redirectTo?: string;
  sendEmailNotification?: boolean;
}) {
  const token = crypto.randomUUID();
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  const callbackUrl = redirectTo
    ? new URL(redirectTo, process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").toString()
    : undefined;

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashed,
      expires,
    },
  });

  const authBase = new URL("/api/auth/callback/email", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  authBase.searchParams.set("token", token);
  authBase.searchParams.set("email", email);
  if (callbackUrl) {
    authBase.searchParams.set("callbackUrl", callbackUrl);
  }

  const url = authBase.toString();

  if (sendEmailNotification) {
    await sendEmail({
      to: email,
      subject: `${SITE_COPY.name} — one-click login`,
      mjml: magicLinkTemplate({ url }),
      text: `Sign in to ${SITE_COPY.name} by visiting ${url}`,
      tags: [{ name: "category", value: "magic-link" }],
    });
  }

  return { url, expires };
}
