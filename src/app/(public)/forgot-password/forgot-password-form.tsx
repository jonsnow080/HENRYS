"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { requestPasswordReset, type ForgotPasswordFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
    const [state, formAction, pending] = useActionState<ForgotPasswordFormState, FormData>(requestPasswordReset, {});

    if (state.success) {
        return (
            <div className="rounded-2xl border border-border/70 bg-card/70 p-6 text-center">
                <h3 className="mb-2 text-lg font-semibold">Check your email</h3>
                <p className="text-muted-foreground">{state.message}</p>
            </div>
        );
    }

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
                    aria-invalid={state?.fieldErrors?.email ? "true" : undefined}
                />
                {state?.fieldErrors?.email ? (
                    <p className="text-sm text-destructive">{state.fieldErrors.email.join(" ")}</p>
                ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending link
                    </span>
                ) : (
                    "Send reset link"
                )}
            </Button>

            {state?.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
        </form>
    );
}
