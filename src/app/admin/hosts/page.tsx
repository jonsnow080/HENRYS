import type { Metadata } from "next";
import { Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { AddHostDialog } from "./add-host-dialog";
import { HostDashboardClient } from "./host-dashboard-client";

export const metadata: Metadata = {
    title: `Hosts · ${SITE_COPY.name}`,
    description: "Manage event hosts and review performance.",
};

export default async function AdminHostsPage() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const hosts = await prisma.user.findMany({
        where: { role: Role.HOST },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            image: true,
            hostedEvents: {
                select: {
                    id: true,
                    startAt: true,
                    endAt: true,
                    payments: {
                        select: {
                            amount: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
    });

    const hostsWithMetrics = hosts.map((host) => {
        const totalEvents = host.hostedEvents.length;
        const pastEvents = host.hostedEvents.filter((e) => e.endAt < now).length;
        const upcomingEvents = host.hostedEvents.filter(
            (e) => e.startAt >= now && e.startAt <= thirtyDaysFromNow
        ).length;

        const totalRevenueCents = host.hostedEvents.reduce((sum, event) => {
            const eventRevenue = event.payments
                .filter((p) => p.status === "succeeded")
                .reduce((pSum, p) => pSum + p.amount, 0);
            return sum + eventRevenue;
        }, 0);

        // Calculate revenue by month for the last 12 months
        const revenueByMonthMap = new Map<string, number>();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        // Initialize last 12 months with 0
        for (let i = 0; i < 12; i++) {
            const d = new Date(twelveMonthsAgo);
            d.setMonth(d.getMonth() + i);
            const key = d.toLocaleString("default", { month: "short" });
            revenueByMonthMap.set(key, 0);
        }

        host.hostedEvents.forEach((event) => {
            event.payments.forEach((payment) => {
                if (payment.status === "succeeded" && payment.createdAt >= twelveMonthsAgo) {
                    const key = payment.createdAt.toLocaleString("default", { month: "short" });
                    if (revenueByMonthMap.has(key)) {
                        revenueByMonthMap.set(key, (revenueByMonthMap.get(key) || 0) + payment.amount);
                    }
                }
            });
        });

        const revenueByMonth = Array.from(revenueByMonthMap.entries()).map(([month, revenue]) => ({
            month,
            revenue,
        }));

        return {
            id: host.id,
            name: host.name,
            email: host.email,
            image: host.image,
            createdAt: host.createdAt,
            metrics: {
                totalEvents,
                pastEvents,
                upcomingEvents,
                totalRevenueCents,
                revenueByMonth,
            },
        };
    });

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Team</p>
                    <h1 className="text-3xl font-semibold sm:text-4xl">Hosts</h1>
                </div>
                <AddHostDialog />
            </header>

            <HostDashboardClient hosts={hostsWithMetrics} />
        </div>
    );
}
