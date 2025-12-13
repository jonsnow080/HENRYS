"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type DataPoint = {
    name: string;
    value: number;
};

export function RevenueChart({ data }: { data: DataPoint[] }) {
    return (
        <div className="h-[300px] w-full rounded-3xl border border-border/60 bg-card/50 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Revenue (USD)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                        formatter={(value) => [`$${value}`, "Revenue"]}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                        opacity={0.8}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
