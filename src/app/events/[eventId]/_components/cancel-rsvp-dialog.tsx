"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export function CancelRsvpDialog({
  eventId,
  refundMessage,
  refundAmountLabel,
  waitlistNote,
}: {
  eventId: string;
  refundMessage: string;
  refundAmountLabel: string | null;
  waitlistNote: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const confirmCancellation = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/cancel`, { method: "POST" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Unable to cancel RSVP");
        }
        setOpen(false);
        router.refresh();
        toast({
          title: "RSVP cancelled",
          description: refundAmountLabel
            ? `We've started a ${refundAmountLabel} refund and offered your seat to the waitlist.`
            : "Your seat has been released to the waitlist.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        toast({
          title: "Unable to cancel",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Cancel RSVP</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your RSVP</DialogTitle>
          <DialogDescription>
            You can’t undo this action. Once cancelled, your seat is immediately offered to the next person in the queue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{refundMessage}</p>
          <p>{waitlistNote}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={isPending}>
              Keep my seat
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirmCancellation} disabled={isPending}>
            {isPending ? "Cancelling…" : "Confirm cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
