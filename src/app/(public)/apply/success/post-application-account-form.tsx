"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { registerAccount, type RegisterFormState } from "@/app/(public)/register/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PostApplicationAccountForm({
  initialEmail = "",
  initialName = "",
  googleEnabled,
}: {
  initialEmail?: string;
  initialName?: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<RegisterFormState, FormData>(registerAccount, {});
  const [googlePending, setGooglePending] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!googleEnabled || googlePending) {
      return;
    }
    try {
      setGooglePending(true);
      await signIn("google", { callbackUrl: "/events" });
    } finally {
      setGooglePending(false);
    }
  };

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {initialName ? <input type="hidden" name="name" value={initialName} /> : null}

      {!initialName ? (
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
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Username (email)</Label>
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Create password</Label>
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
      </div>

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving details
            </span>
          ) : (
            "Create account"
          )}
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-border/70" aria-hidden />
          <span>or</span>
          <span className="h-px flex-1 bg-border/70" aria-hidden />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={!googleEnabled || googlePending}
        >
          {googlePending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Connecting to Google
            </span>
          ) : (
            "Continue with Google"
          )}
        </Button>
        {!googleEnabled ? (
          <p className="text-xs text-muted-foreground">
            Google sign-in isn&apos;t configured yet for this environment. Use your email and password instead.
          </p>
        ) : null}
      </div>

      {state?.message ? (
        <p className={state.success ? "text-sm text-foreground" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
