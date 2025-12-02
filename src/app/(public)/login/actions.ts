"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/prisma-constants";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  redirectTo: z.string().optional(),
  callbackUrl: z.string().optional(),
});

const passwordLoginSchema = loginSchema.extend({
  password: z.string().min(1, "Enter your password"),
});

export type LoginFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

async function getRedirectUrl(email: string, preferredRedirect?: string) {
  // If a specific redirect is requested (and it's not the default dashboard), use it.
  if (preferredRedirect && preferredRedirect !== "/dashboard" && preferredRedirect !== "/") {
    return preferredRedirect;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true, subscriptions: { select: { status: true } } },
  });

  if (!user) return "/dashboard";

  if (user.role === Role.ADMIN) return "/admin";
  if (user.role === Role.HOST) return "/host";

  // For Members (and others)
  const hasActiveSubscription = user.subscriptions.some((sub) => ACTIVE_SUBSCRIPTION_STATUSES.has(sub.status));

  if (hasActiveSubscription) {
    return "/events";
  } else {
    // Unsubscribed members -> offers (subscription offer)
    return "/offers";
  }
}

export async function requestMagicLink(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const preferredRedirect =
    parsed.data.redirectTo && parsed.data.redirectTo.length > 1
      ? parsed.data.redirectTo
      : parsed.data.callbackUrl && parsed.data.callbackUrl.length > 1
        ? parsed.data.callbackUrl
        : undefined;

  const redirectTarget = await getRedirectUrl(parsed.data.email, preferredRedirect);

  try {
    await signIn("resend", {
      email: parsed.data.email,
      redirect: false,
      redirectTo: redirectTarget,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "AccessDenied") {
        return {
          success: false,
          message: "Access is limited to approved members. Check your invite email for next steps.",
        };
      }

      if (error.type === "EmailSignInError") {
        return {
          success: true,
          message: "If your email is registered, a fresh magic link is on the way.",
        };
      }

      return {
        success: false,
        message: "We couldn't start the sign-in process. Please try again shortly.",
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
    message: "Magic link sent! Check your inbox to finish signing in.",
  };
}

export async function loginWithPassword(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = passwordLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const preferredRedirect =
    parsed.data.redirectTo && parsed.data.redirectTo.length > 1
      ? parsed.data.redirectTo
      : parsed.data.callbackUrl && parsed.data.callbackUrl.length > 1
        ? parsed.data.callbackUrl
        : undefined;

  const redirectTarget = await getRedirectUrl(parsed.data.email, preferredRedirect);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: redirectTarget,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "AccessDenied") {
        return {
          success: false,
          message: "Access is limited to approved members. Check your invite email for next steps.",
        };
      }

      if (error.type === "CredentialsSignin") {
        return {
          success: false,
          message: "Incorrect email or password. Try again, or request a magic link instead.",
        };
      }

      return {
        success: false,
        message: "We couldn't sign you in right now. Please try again shortly.",
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

  redirect(redirectTarget);

  return {
    success: true,
    message: "Signed in successfully.",
  };
}
