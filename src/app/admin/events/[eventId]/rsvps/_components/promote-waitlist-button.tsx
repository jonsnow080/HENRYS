"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function PromoteWaitlistButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const promote = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/promote`, { method: "POST" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Unable to promote waitlist");
        }
        const result = (await response.json()) as { status?: string };
        router.refresh();
        toast({
          title: "Promotion triggered",
          description:
            result.status === "promoted"
              ? "Charged and confirmed the next waitlisted member."
              : result.status === "checkout_link_sent"
              ? "Sent a checkout link to the next waitlisted member."
              : result.status === "no_waitlist"
              ? "No one is currently on the waitlist."
              : "Check the queue for current status.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        toast({ title: "Promotion failed", description: message });
      }
    });
  };

  return (
    <Button variant="outline" onClick={promote} disabled={isPending}>
      {isPending ? "Promoting…" : "Promote next waitlist"}
    </Button>
  );
}
