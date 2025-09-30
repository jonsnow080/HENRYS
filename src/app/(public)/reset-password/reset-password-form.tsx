"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { resetPassword, type ResetPasswordFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordFormState, FormData>(resetPassword, {});

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
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
        <Label htmlFor="confirmEmail">Confirm email</Label>
        <Input
          id="confirmEmail"
          name="confirmEmail"
          type="email"
          required
          autoComplete="email"
          defaultValue={initialEmail}
          aria-invalid={state?.fieldErrors?.confirmEmail ? "true" : undefined}
        />
        {state?.fieldErrors?.confirmEmail ? (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmEmail.join(" ")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirmPassword">Confirm new password</Label>
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
            <Loader2 className="h-4 w-4 animate-spin" /> Updating password
          </span>
        ) : (
          "Update password"
        )}
      </Button>

      {state?.message ? (
        <p className={state.success ? "text-sm text-foreground" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
