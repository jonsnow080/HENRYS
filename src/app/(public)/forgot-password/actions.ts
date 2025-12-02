"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordTemplate } from "@/lib/email/templates/reset-password";
import { getBaseUrl } from "@/lib/server-utils";
import crypto from "node:crypto";

const forgotPasswordSchema = z.object({
    email: z.string().email("Enter a valid email"),
});

export type ForgotPasswordFormState = {
    success?: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
};

export async function requestPasswordReset(_: ForgotPasswordFormState, formData: FormData): Promise<ForgotPasswordFormState> {
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return {
            success: false,
            message: "Please enter a valid email address.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
        return {
            success: true,
            message: "If an account exists with that email, we've sent a password reset link.",
        };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await prisma.passwordResetToken.create({
        data: {
            email,
            token,
            expiresAt,
        },
    });

    const baseUrl = await getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
        to: email,
        subject: "Reset your password",
        mjml: resetPasswordTemplate({ resetLink }),
    });

    return {
        success: true,
        message: "If an account exists with that email, we've sent a password reset link.",
    };
}
