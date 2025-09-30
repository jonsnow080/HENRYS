"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    const signInResult = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo,
    });

    if (typeof signInResult === "string" && signInResult.length > 0) {
      const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      try {
        const parsedUrl = new URL(signInResult, baseUrl);
        const errorCode = parsedUrl.searchParams.get("code") ?? parsedUrl.searchParams.get("error");

        if (errorCode) {
          const normalized = errorCode.toUpperCase();

          if (normalized === "ACCESS_DENIED") {
            return {
              success: false,
              message: "Your account was created, but it still needs approval before you can sign in. We\'ll be in touch soon.",
            };
          }

          if (normalized === "CREDENTIALSSIGNIN" || normalized === "INVALID_CREDENTIALS") {
            return {
              success: false,
              message:
                "Your account was created, but we couldn\'t sign you in automatically. Please try signing in.",
            };
          }

          return {
            success: false,
            message:
              "Your account was created, but we couldn\'t finish signing you in. Please try again or use the login page.",
          };
        }
      } catch (parseError) {
        console.warn("Failed to inspect sign-in redirect", parseError);
      }
    }
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return {
        success: false,
        message: "Your account was created, but we couldn\'t sign you in automatically. Please try signing in.",
      };
    }
    if (error instanceof AuthError) {
      const detail =
        typeof error.cause === "object" && error.cause && "message" in error.cause
          ? String((error.cause as { message?: string }).message)
          : error.message;

      if (detail === "ACCESS_DENIED" || error.type === "AccessDenied") {
        return {
          success: false,
          message: "Your account was created, but it still needs approval before you can sign in. We\'ll be in touch soon.",
        };
      }

      return {
        success: false,
        message: "Something unexpected happened while signing you in. Please try again from the login page.",
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

  redirect(redirectTo);
}
