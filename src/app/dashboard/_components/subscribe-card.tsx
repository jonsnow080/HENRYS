"use client";

import { useState, useTransition } from "react";
import { getStripeJs } from "@/lib/stripe/browser";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export type MembershipPlanOption = {
  id: string;
  name: string;
  perks: string[];
};

export function SubscribeCard({ plans }: { plans: MembershipPlanOption[] }) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");
  const [consent, setConsent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/40 p-6 text-sm text-muted-foreground">
        Membership plans are being configured. Check back soon.
      </div>
    );
  }

  const handleCheckout = () => {
    if (!selectedPlanId) {
      toast({ title: "Choose a plan", description: "Select a membership before continuing." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/create-membership-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlanId }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Unable to start checkout");
        }

        const { sessionId } = (await response.json()) as { sessionId: string };
        const stripe = await getStripeJs();
        if (!stripe) throw new Error("Stripe failed to initialise");
        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        toast({
          title: "Checkout failed",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Become a founding member</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick the cadence that suits you. We&apos;ll hold your seat while Stripe completes checkout.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlanId(plan.id)}
            className={`flex h-full flex-col justify-between rounded-2xl border p-5 text-left transition ${
              selectedPlanId === plan.id
                ? "border-foreground bg-foreground/5"
                : "border-border/70 hover:border-foreground/60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {selectedPlanId === plan.id && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">Selected</span>
                )}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground/70" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
            <span className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
              Hosted checkout via Stripe
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="food-drink-consent"
            checked={consent}
            onCheckedChange={(value) => setConsent(Boolean(value))}
          />
          <Label htmlFor="food-drink-consent" className="text-sm leading-relaxed text-muted-foreground">
            I understand tickets and memberships do not include food or drink. Curated options will be available to purchase
            separately.
          </Label>
        </div>
        <Button
          className="w-full"
          disabled={!consent || isPending}
          onClick={handleCheckout}
        >
          {isPending ? "Redirecting to Stripe…" : "Subscribe with Stripe"}
        </Button>
      </div>
    </div>
  );
}
