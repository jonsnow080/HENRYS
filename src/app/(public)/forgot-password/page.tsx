import type { Metadata } from "next";
import Link from "next/link";
import { SITE_COPY } from "@/lib/site-copy";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
    title: `Forgot password · ${SITE_COPY.name}`,
    description: "Reset your password to regain access to your HENRYS account.",
};

export default function ForgotPasswordPage() {
    return (
        <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
            <header className="space-y-3 text-left">
                <h1 className="text-3xl font-semibold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
            </header>
            <ForgotPasswordForm />
            <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
                <p>
                    Remembered your password?{" "}
                    <Link className="font-semibold text-foreground underline" href="/login">
                        Go back to sign in
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
