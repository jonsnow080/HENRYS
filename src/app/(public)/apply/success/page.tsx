import Link from "next/link";

export default async function ApplySuccessPage(props: { searchParams: Promise<{ email?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-border/70 bg-card/80 p-8 sm:p-12">
        <h1 className="text-3xl font-semibold sm:text-4xl">Application received</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Thank you. We review each story personally. Expect a note from the founders soon at
          {searchParams.email ? <span className="ml-1 font-semibold text-foreground">{searchParams.email}</span> : " your inbox"}.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Return home
          </Link>
          <Link href="/faq" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Explore the FAQ →
          </Link>
        </div>
      </div>
    </div>
  );
}
