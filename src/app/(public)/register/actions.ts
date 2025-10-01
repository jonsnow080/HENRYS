"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { Role } from "@/lib/prisma-constants";

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(120, "Name is too long"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
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

export type RegisterFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerAccount(_: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) {
    return {
      success: false,
      message: "An account with that email already exists. Try signing in instead.",
    };
  }

  const hashedPassword = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      passwordHash: hashedPassword,
      role: Role.MEMBER,
    },
  });

  const redirectTo = "/dashboard";
  try {
    await signIn("resend", {
      email: parsed.data.email,
      redirect: false,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "AccessDenied") {
        return {
          success: false,
          message: "Your account was created, but it still needs approval before you can sign in. We\'ll be in touch soon.",
        };
      }

      if (error.type === "EmailSignin" || error.type === "EmailSignInError") {
        return {
          success: true,
          message: "Account created! Check your inbox for your magic link.",
        };
      }

      return {
        success: false,
        message: "Something unexpected happened while starting your session. Please try again from the login page.",
      };
    }
    throw error;
  }

  const store = await cookies();
  store.set({
    name: "henrys-last-login",
    value: Buffer.from(parsed.data.email).toString("base64url"),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 60,
  });

  return {
    success: true,
    message: "Account created! Check your inbox for your magic link.",
  };
}
