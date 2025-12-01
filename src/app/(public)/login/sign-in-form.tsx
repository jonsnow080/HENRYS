"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginWithPassword, requestMagicLink, type LoginFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignInForm({
  redirectTo,
  initialEmail = "",
}: {
  redirectTo?: string;
  initialEmail?: string;
}) {
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [magicState, magicFormAction, magicPending] = useActionState<LoginFormState, FormData>(requestMagicLink, {});
  const [passwordState, passwordFormAction, passwordPending] = useActionState<LoginFormState, FormData>(
    loginWithPassword,
    {},
  );

  const disableToggle = magicPending || passwordPending;

  return (
    <div className="space-y-6">
      <div className="flex rounded-full border border-border/70 bg-muted/40 p-1 text-sm font-medium">
        <Button
          type="button"
          size="sm"
          variant={mode === "magic" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setMode("magic")}
          disabled={disableToggle}
          aria-pressed={mode === "magic"}
        >
          Magic link
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "password" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setMode("password")}
          disabled={disableToggle}
          aria-pressed={mode === "password"}
        >
          Password
        </Button>
      </div>

      {mode === "magic" ? (
        <form action={magicFormAction} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email-magic">Email</Label>
            <Input
              id="email-magic"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              defaultValue={initialEmail}
              aria-invalid={magicState?.fieldErrors?.email ? "true" : undefined}
            />
            {magicState?.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{magicState.fieldErrors.email.join(" ")}</p>
            ) : null}
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

          <Button type="submit" className="w-full" disabled={magicPending}>
            {magicPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending link
              </span>
            ) : (
              "Email me a magic link"
            )}
          </Button>

          {magicState?.message ? (
            <p className={magicState.success ? "text-sm text-foreground" : "text-sm text-destructive"}>
              {magicState.message}
            </p>
          ) : null}
        </form>
      ) : (
        <form action={passwordFormAction} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email-password">Email</Label>
            <Input
              id="email-password"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              defaultValue={initialEmail}
              aria-invalid={passwordState?.fieldErrors?.email ? "true" : undefined}
            />
            {passwordState?.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{passwordState.fieldErrors.email.join(" ")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-invalid={passwordState?.fieldErrors?.password ? "true" : undefined}
            />
            {passwordState?.fieldErrors?.password ? (
              <p className="text-sm text-destructive">{passwordState.fieldErrors.password.join(" ")}</p>
            ) : null}
            <Link
              href="/forgot-password"
              className="block text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

          <Button type="submit" className="w-full" disabled={passwordPending}>
            {passwordPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          {passwordState?.message ? (
            <p className={passwordState.success ? "text-sm text-foreground" : "text-sm text-destructive"}>
              {passwordState.message}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
