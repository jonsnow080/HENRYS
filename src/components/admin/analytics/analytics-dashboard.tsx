"use client";

import * as React from "react";
import { getMemberGrowth, getApprovalRates, getRevenue } from "@/app/admin/actions";
import { GrowthChart } from "./growth-chart";
import { ApprovalRateChart } from "./approval-rate-chart";
import { RevenueChart } from "./revenue-chart";

export function AnalyticsDashboard() {
    type GrowthData = { name: string; value: number };
    type ApprovalData = { name: string; rate: number };
    type RevenueData = { name: string; value: number };

    const [data, setData] = React.useState<{
        growthData: GrowthData[],
        approvalData: ApprovalData[],
        revenueData: RevenueData[]
    } | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        setLoading(true);
        Promise.all([
            getMemberGrowth(),
            getApprovalRates(),
            getRevenue(),
        ]).then(([growthData, approvalData, revenueData]) => {
            setData({ growthData, approvalData, revenueData });
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load analytics data:", err);
            setLoading(false);
        });
    }, []);

    if (loading || !data) {
        return (
            <section className="grid gap-6 lg:grid-cols-3">
                <div className="h-[300px] w-full animate-pulse rounded-3xl border border-border/60 bg-card/50" />
                <div className="h-[300px] w-full animate-pulse rounded-3xl border border-border/60 bg-card/50" />
                <div className="h-[300px] w-full animate-pulse rounded-3xl border border-border/60 bg-card/50" />
            </section>
        );
    }

    return (
        <section className="grid gap-6 lg:grid-cols-3">
            <GrowthChart data={data.growthData} />
            <ApprovalRateChart data={data.approvalData} />
            <RevenueChart data={data.revenueData} />
        </section>
    );
}
