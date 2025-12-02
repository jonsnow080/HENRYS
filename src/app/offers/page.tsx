import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { SignOutButton } from "@/ui/SignOutButton";
import { prisma } from "@/lib/prisma";
import { SubscribeCard, type MembershipPlanOption } from "@/app/dashboard/_components/subscribe-card";

export const metadata: Metadata = {
    title: "Membership Offers",
};

type MembershipPlanRecord = {
    id: string;
    name: string;
    perksJSON: unknown;
};

function parsePerks(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
    }
    return [];
}

export default async function OffersPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;

    const [plansData, subscription] = await Promise.all([
        prisma.membershipPlan.findMany(),
        prisma.subscription.findFirst({ where: { userId } }),
    ]);

    const plansRaw = plansData as MembershipPlanRecord[];

    const plans: MembershipPlanOption[] = plansRaw.map((plan) => ({
        id: plan.id,
        name: plan.name,
        perks: parsePerks(plan.perksJSON),
    }));

    const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);
    const hasActiveSubscription = subscription ? ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) : false;

    if (hasActiveSubscription) {
        redirect("/dashboard");
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium text-foreground">{session.user.email ?? session.user.name ?? "Member"}</p>
                </div>
                <SignOutButton className="self-start sm:self-auto" />
            </div>

            <div className="space-y-4">
                <h1 className="text-3xl font-semibold">Become a Member</h1>
                <p className="text-sm text-muted-foreground">
                    Unlock exclusive access to our curated events and community.
                </p>
            </div>

            <SubscribeCard plans={plans} />
        </div>
    );
}
