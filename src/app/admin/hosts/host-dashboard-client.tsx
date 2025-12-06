"use client";

import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { removeHostAction } from "./actions";

type HostMetric = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
    metrics: {
        totalEvents: number;
        pastEvents: number;
        upcomingEvents: number;
        totalRevenueCents: number;
        revenueByMonth: { month: string; revenue: number }[];
    };
};

export function HostDashboardClient({ hosts }: { hosts: HostMetric[] }) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"revenue" | "events" | "name">("revenue");

    const filteredHosts = useMemo(() => {
        const result = hosts.filter(
            (h) =>
                h.name?.toLowerCase().includes(search.toLowerCase()) ||
                h.email.toLowerCase().includes(search.toLowerCase())
        );

        result.sort((a, b) => {
            if (sort === "revenue") {
                return b.metrics.totalRevenueCents - a.metrics.totalRevenueCents;
            }
            if (sort === "events") {
                return b.metrics.totalEvents - a.metrics.totalEvents;
            }
            return (a.name ?? "").localeCompare(b.name ?? "");
        });

        return result;
    }, [hosts, search, sort]);

    const revenueData = useMemo(() => {
        // Aggregate revenue across all hosts for the chart
        const data: Record<string, number> = {};
        hosts.forEach((host) => {
            host.metrics.revenueByMonth.forEach((item) => {
                data[item.month] = (data[item.month] || 0) + item.revenue;
            });
        });
        return Object.entries(data)
            .map(([month, revenue]) => ({ month, revenue: revenue / 100 }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [hosts]);

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold">Total Revenue Trend</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    formatter={(val: number) => [`$${val.toFixed(2)}`, "Revenue"]}
                                />
                                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold">Top Performers</h3>
                    <div className="space-y-4">
                        {hosts
                            .sort(
                                (a, b) =>
                                    b.metrics.totalRevenueCents - a.metrics.totalRevenueCents
                            )
                            .slice(0, 5)
                            .map((host, i) => (
                                <div key={host.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {host.name ?? host.email}
                                        </span>
                                    </div>
                                    <span className="font-mono text-sm">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        }).format(host.metrics.totalRevenueCents / 100)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Input
                        placeholder="Search hosts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs rounded-xl"
                    />
                    <div className="flex gap-2">
                        <Button
                            variant={sort === "revenue" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSort("revenue")}
                            className="rounded-full"
                        >
                            Revenue
                        </Button>
                        <Button
                            variant={sort === "events" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSort("events")}
                            className="rounded-full"
                        >
                            Events
                        </Button>
                        <Button
                            variant={sort === "name" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSort("name")}
                            className="rounded-full"
                        >
                            Name
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[36px] border border-border/70 bg-card/80">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Host</TableHead>
                                    <TableHead className="text-right">Events</TableHead>
                                    <TableHead className="text-right">Upcoming</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHosts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-12 text-center text-sm text-muted-foreground"
                                        >
                                            No hosts found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredHosts.map((host) => (
                                        <TableRow key={host.id}>
                                            <TableCell className="font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    {host.image ? (
                                                        <img
                                                            src={host.image}
                                                            alt=""
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-muted" />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">
                                                            {host.name ?? "Unnamed User"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {host.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-medium">
                                                        {host.metrics.totalEvents}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {host.metrics.pastEvents} past
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={`font-medium ${host.metrics.upcomingEvents > 0
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {host.metrics.upcomingEvents}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {new Intl.NumberFormat("en-US", {
                                                    style: "currency",
                                                    currency: "USD",
                                                }).format(host.metrics.totalRevenueCents / 100)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <form action={removeHostAction}>
                                                    <input type="hidden" name="userId" value={host.id} />
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        Remove
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
