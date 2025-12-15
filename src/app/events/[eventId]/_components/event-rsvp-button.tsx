"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { rsvpToEvent } from "../actions";

export function EventRsvpButton({ eventId }: { eventId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleRsvp = () => {
        startTransition(async () => {
            try {
                await rsvpToEvent(eventId);
                toast({
                    title: "RSVP Confirmed",
                    description: "You're on the list!",
                });
            } catch (error) {
                toast({
                    title: "RSVP Failed",
                    description: error instanceof Error ? error.message : "Something went wrong",
                });
            }
        });
    };

    return (
        <Button onClick={handleRsvp} disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Confirming..." : "RSVP for Free"}
        </Button>
    );
}
