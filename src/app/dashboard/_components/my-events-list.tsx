"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cancelRsvp } from "../actions";

export type EventRsvpRow = {
    eventId: string;
    eventName: string;
    startAt: Date;
    status: string;
    venue: string | null;
};

export function MyEventsList({ rsvps, allowCancel = true }: { rsvps: EventRsvpRow[]; allowCancel?: boolean }) {
    const [isPending, startTransition] = useTransition();

    if (rsvps.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
                No upcoming events. Browse <Link href="/events" className="underline">events</Link> to find your next salon.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rsvps.map((rsvp) => (
                        <TableRow key={rsvp.eventId}>
                            <TableCell className="font-medium">
                                <Link href={`/events/${rsvp.eventId}`} className="hover:underline">
                                    {rsvp.eventName}
                                </Link>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {rsvp.startAt.toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                })}
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${rsvp.status === 'GOING'
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                    : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20'
                                    }`}>
                                    {rsvp.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                {allowCancel && (
                                    <form
                                        action={() => {
                                            const now = new Date();
                                            const eventStart = new Date(rsvp.startAt);
                                            const hoursUntilStart = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

                                            let message;
                                            if (hoursUntilStart < 24) {
                                                message = "Warning: It is within 24 hours of the event.\n\n- If you paid for a ticket, it is non-refundable.\n- If you are a member, you may be charged a $10 late cancellation fee.\n\nDo you still want to cancel?";
                                            } else {
                                                message = "Since it is more than 24 hours in advance, your ticket will be fully refunded (if applicable).\n\nDo you want to proceed?";
                                            }

                                            if (confirm(message)) {
                                                startTransition(async () => {
                                                    await cancelRsvp(rsvp.eventId);
                                                });
                                            }
                                        }}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel"}
                                        </Button>
                                    </form>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
