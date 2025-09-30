"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { authenticate, type LoginFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignInForm({
  callbackUrl,
  initialEmail = "",
}: {
  callbackUrl?: string;
  initialEmail?: string;
}) {
  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(authenticate, {});

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          defaultValue={initialEmail}
          aria-invalid={state?.fieldErrors?.email ? "true" : undefined}
        />
        {state?.fieldErrors?.email ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email.join(" ")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          aria-invalid={state?.fieldErrors?.password ? "true" : undefined}
        />
        {state?.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password.join(" ")}</p>
        ) : null}
      </div>

      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in
          </span>
        ) : (
          "Sign in"
        )}
      </Button>

      {state?.message ? (
        <p className={state.success ? "text-sm text-foreground" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
