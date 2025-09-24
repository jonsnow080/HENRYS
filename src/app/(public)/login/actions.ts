"use server";

import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { z } from "zod";
import { AuthError } from "next-auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  callbackUrl: z.string().optional(),
});

export type LoginFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function requestMagicLink(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const callback = parsed.data.callbackUrl && parsed.data.callbackUrl.length > 1 ? parsed.data.callbackUrl : "/dashboard";
    await signIn("email", {
      email: parsed.data.email,
      redirect: false,
      redirectTo: callback,
    });

    const store = cookies() as unknown as {
      set: (options: {
        name: string;
        value: string;
        httpOnly?: boolean;
        sameSite?: "lax" | "strict" | "none";
        path?: string;
        secure?: boolean;
        maxAge?: number;
      }) => void;
    };
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
      const detail = typeof error.cause === "object" && error.cause && "message" in error.cause
        ? String((error.cause as { message?: string }).message)
        : error.message;

      if (detail === "USER_NOT_FOUND" || error.type === "CredentialsSignin") {
        return { success: false, message: "We couldn't find an approved member with that email." };
      }
      if (detail === "ACCESS_DENIED") {
        return { success: false, message: "Access is limited to approved members. Check your invite email for next steps." };
      }
      if (detail === "TOO_MANY_REQUESTS") {
        return { success: false, message: "Magic links are cooling down — try again shortly." };
      }
      if (error.type === "CallbackRouteError") {
        return { success: false, message: "Something went wrong sending your magic link. Please try again." };
      }
    }
    throw error;
  }

  return {
    success: true,
    message: "Magic link sent. Check your inbox within the next 15 minutes.",
  };
}
