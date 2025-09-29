"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getStripeJs } from "@/lib/stripe/browser";

export function PurchaseTicketForm({
  eventId,
  priceLabel,
  disabled,
}: {
  eventId: string;
  priceLabel: string;
  disabled?: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const startCheckout = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/checkout`, { method: "POST" });
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
          title: "Unable to purchase",
          description: message,
        });
      }
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold">Reserve your seat</h3>
        <p className="text-sm text-muted-foreground">
          Checkout is handled securely by Stripe. Tickets are {priceLabel} and do not include food or drink.
        </p>
      </div>
      <div className="space-y-3 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="ticket-consent"
            checked={consent}
            onCheckedChange={(value) => setConsent(Boolean(value))}
          />
          <Label htmlFor="ticket-consent" className="text-sm leading-relaxed text-muted-foreground">
            I understand tickets and memberships do not include food or drink. I&apos;ll have the option to purchase extras on the
            night.
          </Label>
        </div>
        <Button
          className="w-full"
          disabled={disabled || !consent || isPending}
          onClick={startCheckout}
        >
          {isPending ? "Redirecting to Stripe…" : `Purchase ticket (${priceLabel})`}
        </Button>
      </div>
    </div>
  );
}
