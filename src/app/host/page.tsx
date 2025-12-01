import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateEventWizard } from "../admin/events/create-event-wizard";

// Infer the Event type to avoid export issues
type Event = NonNullable<Awaited<ReturnType<typeof prisma.event.findFirst>>>;

export default async function HostDashboardPage() {
    const session = await auth();
    const now = new Date();

    const upcomingEvents = await prisma.event.findMany({
        where: { startAt: { gte: now } },
        orderBy: { startAt: "asc" },
        take: 10,
    });

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
            <header className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Host Dashboard</p>
                <h1 className="text-3xl font-semibold sm:text-4xl">Welcome, {session?.user?.name ?? "Host"}</h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                    Manage your events and guest lists.
                </p>
            </header>

            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Upcoming Events</h2>
                    <CreateEventWizard redirectUrlPattern="/events/:id" />
                </div>

                {upcomingEvents.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-12 text-center text-muted-foreground">
                        No upcoming events found. Create one to get started!
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {upcomingEvents.map((event: Event) => (
                            <div key={event.id} className="rounded-2xl border border-border/60 bg-card p-6">
                                <h3 className="font-semibold">{event.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(event.startAt).toLocaleDateString()}
                                </p>
                                <div className="mt-4">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/events/${event.slug}`}>View Details</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
