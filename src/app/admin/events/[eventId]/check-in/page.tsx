import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, RsvpStatus } from "@/lib/prisma-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toggleAttendedAction } from "../rsvps/actions";
import { Check, X } from "lucide-react";

export default async function EventCheckInPage(props: {
    params: Promise<{ eventId: string }>;
    searchParams: Promise<{ q?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const session = await auth();

    if (!session?.user || session.user.role !== Role.ADMIN) {
        redirect("/login");
    }

    const event = await prisma.event.findUnique({
        where: { id: params.eventId },
        include: {
            rsvps: {
                include: {
                    user: true,
                },
                orderBy: {
                    user: {
                        name: "asc",
                    },
                },
            },
        },
    });

    if (!event) {
        notFound();
    }

    const query = typeof searchParams.q === "string" ? searchParams.q.toLowerCase() : "";

    // Filter mainly for GOING guests, but we could allow others if needed.
    // For check-in, usually we only care about confirmed guests.
    const rsvps = event.rsvps.filter((rsvp) => {
        // Only show GOING or matching search
        if (rsvp.status !== RsvpStatus.GOING) return false;

        if (query) {
            const name = rsvp.user.name?.toLowerCase() ?? "";
            const email = rsvp.user.email?.toLowerCase() ?? "";
            return name.includes(query) || email.includes(query);
        }
        return true;
    });

    const stats = {
        capacity: event.capacity,
        attended: event.rsvps.filter((r) => r.attended).length,
        going: event.rsvps.filter((r) => r.status === RsvpStatus.GOING).length,
    };

    const isAtCapacity = stats.attended >= stats.capacity;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto max-w-md space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-semibold leading-tight">{event.name}</h1>
                            <p className="text-xs text-muted-foreground">Check-in Mode</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 text-right">
                            <div className={`text-2xl font-bold ${isAtCapacity ? "text-destructive" : "text-foreground"}`}>
                                {stats.attended} <span className="text-base font-normal text-muted-foreground">/ {stats.capacity}</span>
                            </div>
                        </div>
                    </div>

                    <form className="relative">
                        <Input
                            name="q"
                            placeholder="Search guest..."
                            defaultValue={searchParams.q}
                            className="h-10 w-full rounded-full bg-muted/50 px-4 text-base"
                            autoComplete="off"
                        />
                    </form>
                </div>
            </header>

            {/* List */}
            <main className="mx-auto max-w-md px-4 py-4">
                {rsvps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <p>No accessible guests found.</p>
                        {query && <p className="text-sm">Try a different search.</p>}
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {rsvps.map((rsvp) => (
                            <li key={rsvp.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-sm">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-medium text-foreground">{rsvp.user.name}</p>
                                        {rsvp.noShow && (
                                            <Badge variant="outline" className="h-5 border-destructive/50 px-1.5 text-[10px] text-destructive">
                                                No-show
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-muted-foreground">{rsvp.user.email}</p>
                                </div>

                                <form action={toggleAttendedAction}>
                                    <input type="hidden" name="rsvpId" value={rsvp.id} />
                                    <input type="hidden" name="eventId" value={event.id} />
                                    <input type="hidden" name="redirectTo" value={`/admin/events/${event.id}/check-in?q=${encodeURIComponent(query)}`} />

                                    <Button
                                        type="submit"
                                        size="lg"
                                        variant={rsvp.attended ? "default" : "outline"}
                                        className={`h-12 w-12 rounded-full p-0 transition-all ${rsvp.attended
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                : "border-2 border-muted-foreground/20 hover:border-primary hover:bg-muted/50 hover:text-primary"
                                            }`}
                                    >
                                        {rsvp.attended ? (
                                            <Check className="h-6 w-6" />
                                        ) : (
                                            <span className="h-4 w-4 rounded-full bg-muted-foreground/20" />
                                        )}
                                        <span className="sr-only">Toggle check-in</span>
                                    </Button>
                                </form>
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            {/* Footer Nav */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/80 px-4 py-3 backdrop-blur safe-area-bottom">
                <div className="mx-auto flex max-w-md items-center justify-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/rsvps`}>Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
