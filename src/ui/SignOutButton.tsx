import { signOut } from "@/auth";
import { cn, getBaseUrl } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: await getBaseUrl() });
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className={cn(
          "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
          className,
        )}
      >
        Sign out
      </button>
    </form>
  );
}
