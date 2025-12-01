"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { resetPassword, type ResetPasswordFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordFormState, FormData>(resetPassword, {});

  if (state.success) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold">Password updated</h3>
        <p className="text-muted-foreground">{state.message}</p>
        <Button asChild className="mt-4 w-full">
          <a href="/login">Sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="token" value={token} />

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
