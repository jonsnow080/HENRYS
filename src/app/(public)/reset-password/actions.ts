"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const resetSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    confirmEmail: z.string().email("Re-enter your email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .superRefine((value, ctx) => {
    if (value.email !== value.confirmEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Emails must match",
        path: ["confirmEmail"],
      });
    }
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

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (!user) {
    return {
      success: false,
      message: "We couldn\'t find an account with that email. Double-check the address or create a new account.",
    };
  }

  const hashedPassword = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
    },
  });

  return {
    success: true,
    message: "Password updated successfully. You can now sign in with your new password.",
  };
}
