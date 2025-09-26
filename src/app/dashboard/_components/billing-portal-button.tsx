"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function BillingPortalButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const openPortal = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/billing-portal", { method: "POST" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Unable to open billing portal");
        }
        const { url } = (await response.json()) as { url: string };
        window.location.href = url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        toast({
          title: "Portal unavailable",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Button variant="outline" onClick={openPortal} disabled={isPending}>
      {isPending ? "Opening…" : "Manage billing"}
    </Button>
  );
}
