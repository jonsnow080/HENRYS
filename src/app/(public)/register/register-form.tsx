"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { registerAccount, type RegisterFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegisterForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [state, formAction, pending] = useActionState<RegisterFormState, FormData>(registerAccount, {});

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Avery Kim"
          required
          autoComplete="name"
          aria-invalid={state?.fieldErrors?.name ? "true" : undefined}
        />
        {state?.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name.join(" ")}</p>
        ) : null}
      </div>

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
          required
          autoComplete="new-password"
          aria-invalid={state?.fieldErrors?.password ? "true" : undefined}
        />
        {state?.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password.join(" ")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={state?.fieldErrors?.confirmPassword ? "true" : undefined}
        />
        {state?.fieldErrors?.confirmPassword ? (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword.join(" ")}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Creating account
          </span>
        ) : (
          "Create account"
        )}
      </Button>

      {state?.message ? (
        <p className={state.success ? "text-sm text-foreground" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
