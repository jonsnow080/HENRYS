"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function ResendReceiptButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const resend = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/receipts/resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Unable to send receipt");
        }

        toast({
          title: "Receipt sent",
          description: "Check your inbox for the latest copy.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        toast({
          title: "Could not resend",
          description: message,
        });
      }
    });
  };

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto px-0 text-xs font-medium"
      onClick={resend}
      disabled={isPending}
    >
      {isPending ? "Sending…" : "Email receipt"}
    </Button>
  );
}
