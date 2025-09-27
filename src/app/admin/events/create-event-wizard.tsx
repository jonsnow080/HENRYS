"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createEventAction, type CreateEventState } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const steps = [
  { key: "basics", title: "Basics", description: "Give your gathering a name and vibe." },
  { key: "schedule", title: "Schedule", description: "When should RSVPs arrive?" },
  { key: "logistics", title: "Logistics", description: "Capacity, pricing, and venue details." },
] as const;

type Step = (typeof steps)[number];

export function CreateEventWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(createEventAction, {});

  useEffect(() => {
    if (state.status === "success" && state.eventId) {
      setOpen(false);
      router.push(`/admin/events/${state.eventId}/rsvps`);
    }
  }, [router, state.eventId, state.status]);

  const currentStep: Step = steps[stepIndex] ?? steps[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setStepIndex(0);
          setIsPublic(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full px-4">Create event</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a new event</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center gap-2">
              <span className={index === stepIndex ? "text-foreground" : undefined}>{step.title}</span>
              {index < steps.length - 1 ? <span>•</span> : null}
            </div>
          ))}
        </div>
        <form
          action={(formData) => {
            formAction(formData);
          }}
          className="space-y-6"
        >
          <section className={stepIndex === 0 ? "space-y-4" : "hidden"}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Members' Salon: Fire & Ice" required />
              {state.errors?.title ? <p className="text-xs text-destructive">{state.errors.title}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" name="summary" rows={3} placeholder="A supper pairing opposites for an evening of sparks." />
              {state.errors?.summary ? <p className="text-xs text-destructive">{state.errors.summary}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                name="details"
                rows={4}
                placeholder="Add arrival notes, hosts, dress code, or any storytelling flourish."
              />
            </div>
          </section>

          <section className={stepIndex === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
            <div className="space-y-2">
              <Label htmlFor="startAt">Start</Label>
              <Input id="startAt" name="startAt" type="datetime-local" required />
              {state.errors?.startAt ? <p className="text-xs text-destructive">{state.errors.startAt}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">End</Label>
              <Input id="endAt" name="endAt" type="datetime-local" required />
              {state.errors?.endAt ? <p className="text-xs text-destructive">{state.errors.endAt}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsvpDeadline">RSVP deadline</Label>
              <Input id="rsvpDeadline" name="rsvpDeadline" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueHiddenUntil">Reveal venue on</Label>
              <Input id="venueHiddenUntil" name="venueHiddenUntil" type="datetime-local" />
            </div>
          </section>

          <section className={stepIndex === 2 ? "space-y-4" : "hidden"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" name="capacity" type="number" min={1} defaultValue={40} required />
                {state.errors?.capacity ? <p className="text-xs text-destructive">{state.errors.capacity}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Ticket price (USD)</Label>
                <Input id="price" name="price" type="number" step="0.01" min={0} defaultValue={45} />
                {state.errors?.price ? <p className="text-xs text-destructive">{state.errors.price}</p> : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue name</Label>
              <Input id="venueName" name="venueName" placeholder="Soho loft" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueAddress">Venue address</Label>
              <Input id="venueAddress" name="venueAddress" placeholder="123 Mercer St, New York" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueNotes">Venue notes</Label>
              <Textarea id="venueNotes" name="venueNotes" rows={3} placeholder="Buzz 12 for entry, elevator is vintage." />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-4">
              <div>
                <p className="text-sm font-medium">Publicly visible</p>
                <p className="text-xs text-muted-foreground">
                  When off, only members with the link can access the RSVP page.
                </p>
              </div>
              <input type="hidden" name="visibility" value={isPublic ? "true" : "false"} />
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </section>

          {state.message && state.status === "error" ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
                >
                  Back
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {stepIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStepIndex((index) => Math.min(index + 1, steps.length - 1))}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating…" : "Create event"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
