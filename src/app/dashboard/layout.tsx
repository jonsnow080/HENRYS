import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";

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

    return <>{children}</>;
}
