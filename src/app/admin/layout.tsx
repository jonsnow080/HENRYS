import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
        loginUrl.searchParams.set("redirectTo", "/admin");
        redirect(loginUrl.toString());
    }

    if (session.user.role !== Role.ADMIN) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
