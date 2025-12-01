"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const resetSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords must match",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function resetPassword(_: ResetPasswordFormState, formData: FormData): Promise<ResetPasswordFormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return {
      success: false,
      message: "Invalid or expired token. Please request a new password reset link.",
    };
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { email: resetToken.email },
    data: {
      passwordHash: hashedPassword,
    },
  });

  await prisma.passwordResetToken.delete({
    where: { token },
  });

  return {
    success: true,
    message: "Password updated successfully. You can now sign in with your new password.",
  };
}
