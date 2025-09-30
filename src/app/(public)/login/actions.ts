"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  callbackUrl: z.string().optional(),
});

export type LoginFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function authenticate(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return {
      success: false,
      message: "We couldn't find an account with that email and password. Try resetting your password.",
    };
  }

  const callback = parsed.data.callbackUrl && parsed.data.callbackUrl.length > 1 ? parsed.data.callbackUrl : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: callback,
    });

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
  } catch (error) {
    if (error instanceof AuthError) {
      const detail =
        typeof error.cause === "object" && error.cause && "message" in error.cause
          ? String((error.cause as { message?: string }).message)
          : error.message;

      if (detail === "ACCESS_DENIED") {
        return {
          success: false,
          message: "Access is limited to approved members. Check your invite email for next steps.",
        };
      }

      if (detail === "INVALID_CREDENTIALS" || error.type === "CredentialsSignin") {
        return { success: false, message: "We couldn't sign you in with those credentials." };
      }
    }
    throw error;
  }

  redirect(callback);
}
