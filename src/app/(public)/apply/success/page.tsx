import Link from "next/link";
import { PostApplicationAccountForm } from "./post-application-account-form";

type SuccessSearchParams = Promise<{ email?: string; fullName?: string }>;

export default async function ApplySuccessPage({
  searchParams,
}: {
  searchParams: SuccessSearchParams;
}) {
  const resolved = await searchParams;
  const email = resolved.email ?? "";
  const fullName = resolved.fullName ?? "";
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-border/70 bg-card/80 p-8 sm:p-12">
        <h1 className="text-3xl font-semibold sm:text-4xl">Your application is being reviewed</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Thanks for sharing your story. Our team personally reviews every application. While we prepare your invite,
          set up your member account so you can view and request spots for upcoming events as soon as you&apos;re approved.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-foreground underline-offset-4 transition hover:underline">
            Return home
          </Link>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-border/70 sm:inline" />
          <Link href="/faq" className="font-medium text-foreground underline-offset-4 transition hover:underline">
            Visit the FAQ
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] border border-border/70 bg-card/80 p-8 sm:p-12">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Create your login details</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve pre-filled your username with the email from your application. Choose a secure password so you can
            access the member portal and event calendar next time you sign in.
          </p>
        </header>
        <div className="mt-8">
          <PostApplicationAccountForm
            initialEmail={email}
            initialName={fullName}
            googleEnabled={googleEnabled}
          />
        </div>
      </section>
    </div>
  );
}
