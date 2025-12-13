import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
import { SignOutButton } from "@/ui/SignOutButton";
import { DashboardNav } from "./_components/dashboard-nav";

const memberRoleSet = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
        loginUrl.searchParams.set("redirectTo", "/dashboard");
        redirect(loginUrl.toString());
    }

    if (!session.user.role || !memberRoleSet.has(session.user.role)) {
        redirect("/apply");
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium text-foreground">{session.user.email ?? session.user.name ?? "Member"}</p>
                </div>
                <SignOutButton className="self-start sm:self-auto" />
            </div>

            <div className="flex flex-col gap-6">
                <DashboardNav />
                {children}
            </div>
        </div>
    );
}
