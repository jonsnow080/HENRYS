import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";

const hostRoleSet = new Set<Role>([Role.HOST, Role.ADMIN]);

export default async function HostLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
        loginUrl.searchParams.set("redirectTo", "/host");
        redirect(loginUrl.toString());
    }

    if (!session.user.role || !hostRoleSet.has(session.user.role)) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
