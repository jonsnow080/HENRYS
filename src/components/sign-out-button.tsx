import { signOut } from "@/auth";

export function SignOutButton() {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
