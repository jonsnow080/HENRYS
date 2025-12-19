
import { User } from "lucide-react";

type MetricTileProps = {
    label: string;
    value: string | number;
    subtext: string;
    highlight?: boolean;
};

function MetricTile({ label, value, subtext, highlight }: MetricTileProps) {
    return (
        <div className={`flex flex-col justify-between rounded-3xl border p-6 shadow-sm ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="mt-4">
                <p className="text-4xl font-bold tracking-tight text-foreground">{value}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-foreground/80">
                    <User className="h-4 w-4 opacity-70" />
                    <span className="font-medium truncate">{subtext}</span>
                </div>
            </div>
        </div>
    );
}

export type HostHighlights = {
    mostUpcoming: { name: string; count: number } | null;
    mostPast: { name: string; count: number } | null;
    highestRevenue: { name: string; amountCents: number } | null;
    lowestNoShowRate: { name: string; rate: number; totalRsvps: number } | null;
};

export function HostMetricsTiles({ highlights }: { highlights: HostHighlights }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
                label="Most Upcoming"
                value={highlights.mostUpcoming?.count ?? 0}
                subtext={highlights.mostUpcoming?.name ?? "N/A"}
            />
            <MetricTile
                label="Most Past Events"
                value={highlights.mostPast?.count ?? 0}
                subtext={highlights.mostPast?.name ?? "N/A"}
            />
            <MetricTile
                label="Highest Revenue"
                value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((highlights.highestRevenue?.amountCents ?? 0) / 100)}
                subtext={highlights.highestRevenue?.name ?? "N/A"}
                highlight
            />
            <MetricTile
                label="Reliability (No-Show)"
                value={highlights.lowestNoShowRate ? `${(highlights.lowestNoShowRate.rate * 100).toFixed(1)}%` : "N/A"}
                subtext={highlights.lowestNoShowRate?.name ?? "N/A"}
            />
        </div>
    );
}
