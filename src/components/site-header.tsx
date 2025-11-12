import Link from "next/link";
import type { Session } from "next-auth";
import { Role } from "@/lib/prisma-constants";
import { SITE_COPY } from "@/lib/site-copy";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { SignOutButton } from "@/ui/SignOutButton";

const navItems: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/apply", label: "Apply" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "Dashboard", roles: [Role.MEMBER, Role.HOST, Role.ADMIN] },
  { href: "/host", label: "Host" },
  { href: "/admin", label: "Admin", roles: [Role.ADMIN] },
];

export function SiteHeader({ session }: { session: Session | null }) {
  const role = session?.user.role;

  return (
    <header className="site-header sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="rounded-full bg-foreground px-3 py-1 text-background">{SITE_COPY.name}</span>
          <span className="hidden text-muted-foreground sm:inline">Slow dating for the wildly interesting</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            {navItems
              .filter((item) => !item.roles || (role && item.roles.includes(role)))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
          </nav>
          <DarkModeToggle />
          {session?.user ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Admin View</Link>
              </Button>
              <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {session.user.name ?? "member"}</span>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Admin View</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login">Member sign-in</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
