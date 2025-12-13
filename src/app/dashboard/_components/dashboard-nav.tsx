"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
    { name: "Overview", href: "/dashboard" },
    { name: "Profile", href: "/dashboard/profile" },
];

export function DashboardNav() {
    const pathname = usePathname();

    return (
        <div className="flex items-center border-b pt-4">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "border-b-2 px-4 pb-2 text-sm font-medium transition-colors hover:text-foreground",
                            isActive
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground"
                        )}
                    >
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
