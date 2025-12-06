import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    console.log("[AdminLayout] Session:", JSON.stringify(session, null, 2));
    console.log("[AdminLayout] User Role:", session?.user?.role);

    // if (!session?.user) {
    //     const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
    //     loginUrl.searchParams.set("redirectTo", "/admin");
    //     redirect(loginUrl.toString());
    // }

    // if (session.user.role !== Role.ADMIN) {
    //     redirect("/dashboard");
    // }

    return (
        <div className="p-8 space-y-4">
            <div className="bg-yellow-100 p-4 rounded border border-yellow-400 text-yellow-900">
                <h3 className="font-bold">Debug Mode</h3>
                <pre className="mt-2 text-xs overflow-auto p-2 bg-white rounded border">
                    {JSON.stringify({
                        msg: "AdminLayout Session Check",
                        hasSession: !!session,
                        user: session?.user,
                        role: session?.user?.role,
                        expectedRole: Role.ADMIN
                    }, null, 2)}
                </pre>
            </div>
            {children}
        </div>
    );
}
