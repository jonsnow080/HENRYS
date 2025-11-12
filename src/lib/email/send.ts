import { Resend } from "resend";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { renderMjml } from "./mjml";
import {
  CANONICAL_FROM_EMAIL,
  CANONICAL_REPLY_TO,
} from "@/lib/site/emails";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });

  return transporter;
}

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  mjml: string;
  text?: string;
  tags?: { name: string; value: string }[];
};

export async function sendEmail({
  to,
  subject,
  mjml,
  text,
  tags,
}: SendEmailOptions) {
  const html = renderMjml(mjml);
  const recipients = Array.isArray(to) ? to : [to];
  const bcc = process.env.RESEND_MIRROR_TO
    ? [process.env.RESEND_MIRROR_TO]
    : undefined;

  if (resendClient) {
    await resendClient.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ??
        process.env.AUTH_EMAIL_FROM ??
        CANONICAL_FROM_EMAIL,
      to: recipients,
      bcc,
      subject,
      html,
      text,
      reply_to: process.env.RESEND_REPLY_TO_EMAIL ?? CANONICAL_REPLY_TO,
      tags,
    });
    return;
  }

  const nodemailerTransport = await getTransporter();
  if (!nodemailerTransport) {
    console.log("Email delivery disabled. Payload:", {
      to: recipients,
      subject,
      text,
    });
    return;
  }

  const message: Mail.Options = {
    from: process.env.AUTH_EMAIL_FROM ?? CANONICAL_FROM_EMAIL,
    to: recipients,
    bcc,
    subject,
    html,
    text,
    replyTo: process.env.SMTP_REPLY_TO ?? CANONICAL_REPLY_TO,
  };

  await nodemailerTransport.sendMail(message);
}
