import { PrismaClient } from "@prisma/client";
import { Role } from "../src/lib/prisma-constants";
import { inviteTemplate } from "../src/lib/email/templates";
import { SITE_COPY } from "../src/lib/site-copy";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { loadEnvConfig } from "@next/env";
import { Resend } from "resend";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const TOKEN_TTL_MINUTES = 15;

async function createMagicLinkLocal(email: string, redirectTo: string = "/dashboard") {
    const token = crypto.randomUUID();
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    const callbackUrl = new URL(redirectTo, process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").toString();

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
        authBase.searchParams.set("redirectTo", callbackUrl);
    }

    return { url: authBase.toString() };
}

function fallbackRender(template: string): string {
    let content = template;
    const replacements: Array<[RegExp, string]> = [
        [/<\/\s*mjml\s*>/g, ""],
        [/<\s*mjml[^>]*>/g, ""],
        [/<\s*mj-head[^>]*>/g, "<head>"],
        [/<\s*\/\s*mj-head\s*>/g, "</head>"],
        [/<\s*mj-body[^>]*>/g, "<body style=\"margin:0;padding:0;background-color:#f6f7f9;\">"],
        [/<\s*\/\s*mj-body\s*>/g, "</body>"],
        [/<\s*mj-section[^>]*>/g, "<section style=\"margin:24px auto;max-width:640px;background-color:#ffffff;padding:32px;border-radius:24px;\">"],
        [/<\s*\/\s*mj-section\s*>/g, "</section>"],
        [/<\s*mj-column[^>]*>/g, "<div style=\"margin:0 auto;\">"],
        [/<\s*\/\s*mj-column\s*>/g, "</div>"],
        [/<\s*mj-text[^>]*>/g, "<p style=\"margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;color:#161616;\">"],
        [/<\s*\/\s*mj-text\s*>/g, "</p>"],
        [/<\s*mj-button[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\s*\/\s*mj-button\s*>/g, "<p><a href=\"$1\" style=\"display:inline-block;padding:12px 24px;border-radius:9999px;background-color:#111827;color:#ffffff;text-decoration:none;\">$2</a></p>"],
        [/<\s*mj-button[^>]*>([\s\S]*?)<\s*\/\s*mj-button\s*>/g, "<p><span style=\"display:inline-block;padding:12px 24px;border-radius:9999px;background-color:#111827;color:#ffffff;\">$1</span></p>"],
        [/<\s*mj-style[^>]*>([\s\S]*?)<\s*\/\s*mj-style\s*>/g, "<style>$1</style>"],
        [/<\s*mj-title\s*>([\s\S]*?)<\s*\/\s*mj-title\s*>/g, "<title>$1</title>"],
    ];

    for (const [pattern, replacement] of replacements) {
        content = content.replace(pattern, replacement);
    }

    const headMatch = content.match(/<head>[\s\S]*?<\/head>/i);
    const head = headMatch ? headMatch[0] : "<head></head>";
    const withoutHead = headMatch ? content.replace(headMatch[0], "") : content;
    const bodyMatch = withoutHead.match(/<body[\s\S]*?<\/body>/i);
    const body = bodyMatch ? bodyMatch[0] : `<body>${withoutHead}</body>`;

    return `<!doctype html><html>${head}${body}</html>`;
}

async function sendEmailLocal({ to, subject, mjml, text }: { to: string; subject: string; mjml: string; text: string }) {
    const html = fallbackRender(mjml);

    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.RESEND_FROM_EMAIL ?? process.env.AUTH_EMAIL_FROM ?? "HENRYS <mail@henrys.club>";
        console.log(`Sending email from: ${from}`);
        try {
            const data = await resend.emails.send({
                from,
                to,
                subject,
                html,
                text,
            });
            console.log("Resend response:", JSON.stringify(data, null, 2));
        } catch (error) {
            console.error("Resend error:", error);
        }
        return;
    }

    if (!process.env.SMTP_HOST) {
        console.warn("SMTP_HOST not set, skipping email sending.");
        return;
    }

    const transporter = nodemailer.createTransport({
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

    await transporter.sendMail({
        from: process.env.AUTH_EMAIL_FROM ?? "HENRYS Club <no-reply@henrys.club>",
        to,
        subject,
        html,
        text,
    });
}

async function main() {
    const email = "kaylaesinaldridge@gmail.com";
    const name = "Kayla Esin Aldridge";

    console.log(`Upserting admin user: ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: Role.ADMIN,
            name,
        },
        create: {
            email,
            name,
            role: Role.ADMIN,
        },
    });

    console.log(`User upserted: ${user.id}`);

    console.log("Generating magic link...");
    const { url } = await createMagicLinkLocal(user.email, "/dashboard");

    console.log(`Magic link generated: ${url}`);

    console.log("Sending invite email...");
    await sendEmailLocal({
        to: user.email,
        subject: `Welcome to ${SITE_COPY.name}`,
        mjml: inviteTemplate({
            name: user.name ?? name,
            magicLink: url,
        }),
        text: `You're approved for ${SITE_COPY.name}. Use this link to sign in: ${url}`,
    });

    console.log("Email sent successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
