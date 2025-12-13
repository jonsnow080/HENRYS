import { getMemberGrowth, getApprovalRates, getRevenue } from "@/app/admin/actions";
import { GrowthChart } from "./growth-chart";
import { ApprovalRateChart } from "./approval-rate-chart";
import { RevenueChart } from "./revenue-chart";

export async function AnalyticsDashboard() {
    const [growthData, approvalData, revenueData] = await Promise.all([
        getMemberGrowth(),
        getApprovalRates(),
        getRevenue(),
    ]);

    return (
        <section className="grid gap-6 lg:grid-cols-3">
            <GrowthChart data={growthData} />
            <ApprovalRateChart data={approvalData} />
            <RevenueChart data={revenueData} />
        </section>
    );
}
