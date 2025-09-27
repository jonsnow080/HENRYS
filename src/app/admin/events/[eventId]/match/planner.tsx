"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveSeatingAssignmentsAction, type SaveSeatingState } from "./actions";

const AGE_BUCKETS = [
  { label: "All ages", value: "all", test: () => true },
  { label: "Under 25", value: "under25", test: (age?: number) => typeof age === "number" && age < 25 },
  { label: "25-34", value: "25-34", test: (age?: number) => typeof age === "number" && age >= 25 && age <= 34 },
  { label: "35-44", value: "35-44", test: (age?: number) => typeof age === "number" && age >= 35 && age <= 44 },
  { label: "45+", value: "45+", test: (age?: number) => typeof age === "number" && age >= 45 },
] as const;

type Attendee = {
  id: string;
  userId: string;
  name: string;
  email: string;
  seatGroupId: string | null;
  age?: number;
  vibe?: number;
  dietary?: string;
  dietaryNotes?: string;
  dontPairWithIds: string[];
};

type SeatGroup = {
  id: string;
  tableNumber: number;
  capacity: number;
};

type PlannerProps = {
  eventId: string;
  attendees: Attendee[];
  seatGroups: SeatGroup[];
};

export function SeatingPlanner({ eventId, attendees, seatGroups }: PlannerProps) {
  const initialAssignments = useMemo(() => {
    const map = new Map<string, string | null>();
    attendees.forEach((attendee) => {
      map.set(attendee.id, attendee.seatGroupId ?? null);
    });
    return map;
  }, [attendees]);

  const [baseline, setBaseline] = useState(() => new Map(initialAssignments));
  const [assignments, setAssignments] = useState(() => new Map(initialAssignments));

  useEffect(() => {
    setBaseline(new Map(initialAssignments));
    setAssignments(new Map(initialAssignments));
  }, [initialAssignments]);
  const [ageFilter, setAgeFilter] = useState<(typeof AGE_BUCKETS)[number]["value"]>("all");
  const dietaryOptions = useMemo(() => {
    const set = new Set<string>();
    attendees.forEach((attendee) => {
      if (attendee.dietary) set.add(attendee.dietary);
    });
    return Array.from(set);
  }, [attendees]);
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [minVibe, setMinVibe] = useState(0);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<SaveSeatingState, FormData>(
    saveSeatingAssignmentsAction,
    {},
  );

  useEffect(() => {
    if (state.status === "success") {
      setBaseline(new Map(assignments));
    }
  }, [state.status, assignments]);

  const assignedMap = useMemo(() => {
    const map = new Map<string, Attendee[]>();
    seatGroups.forEach((group) => map.set(group.id, []));
    attendees.forEach((attendee) => {
      const seat = assignments.get(attendee.id) ?? null;
      if (seat && map.has(seat)) {
        map.get(seat)!.push(attendee);
      }
    });
    return map;
  }, [attendees, assignments, seatGroups]);

  const pool = attendees.filter((attendee) => {
    const seat = assignments.get(attendee.id) ?? null;
    if (seat) return false;
    if (search) {
      const haystack = `${attendee.name} ${attendee.email}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    const ageBucket = AGE_BUCKETS.find((bucket) => bucket.value === ageFilter) ?? AGE_BUCKETS[0]!;
    if (!ageBucket.test(attendee.age)) return false;
    if (dietaryFilter !== "all") {
      if (!attendee.dietary || attendee.dietary !== dietaryFilter) return false;
    }
    if (attendee.vibe !== undefined && attendee.vibe < minVibe) return false;
    return true;
  });

  const hasChanges = useMemo(() => {
    for (const attendee of attendees) {
      if ((assignments.get(attendee.id) ?? null) !== (baseline.get(attendee.id) ?? null)) {
        return true;
      }
    }
    return false;
  }, [assignments, attendees, baseline]);

  const submitAssignments = (formData: FormData) => {
    const payload = attendees.map((attendee) => ({
      rsvpId: attendee.id,
      seatGroupId: assignments.get(attendee.id) ?? null,
    }));
    formData.append("eventId", eventId);
    formData.append("assignments", JSON.stringify(payload));
    formAction(formData);
  };

  const handleDrop = (attendeeId: string, seatGroupId: string | null) => {
    const attendee = attendees.find((entry) => entry.id === attendeeId);
    if (!attendee) return;
    if (seatGroupId) {
      const occupants = assignedMap.get(seatGroupId) ?? [];
      if (occupants.length >= (seatGroups.find((group) => group.id === seatGroupId)?.capacity ?? 0)) {
        setFeedback(`Table is full. Try another group for ${attendee.name}.`);
        return;
      }
      const conflict = occupants.find((occupant) =>
        occupant.dontPairWithIds.includes(attendee.userId) || attendee.dontPairWithIds.includes(occupant.userId),
      );
      if (conflict) {
        setFeedback(`Respecting preferences: avoid pairing ${attendee.name} with ${conflict.name}.`);
        return;
      }
    }
    setAssignments((prev) => new Map(prev).set(attendeeId, seatGroupId));
    setFeedback(null);
  };

  const autoSuggest = () => {
    const capacityMap = new Map<string, { capacity: number; attendees: Attendee[] }>();
    seatGroups.forEach((group) => {
      capacityMap.set(group.id, { capacity: group.capacity, attendees: [] });
    });

    // Shuffle attendees by vibe + randomness to increase diversity.
    const shuffled = [...attendees]
      .filter((attendee) => attendee.vibe !== undefined)
      .sort((a, b) => (b.vibe ?? 0) - (a.vibe ?? 0));
    const remainder = attendees.filter((attendee) => attendee.vibe === undefined);
    shuffled.push(...remainder);

    const result = new Map<string, string | null>();

    for (const attendee of shuffled) {
      let bestSeat: string | null = null;
      let bestScore = Number.POSITIVE_INFINITY;
      for (const group of seatGroups) {
        const entry = capacityMap.get(group.id)!;
        if (entry.attendees.length >= group.capacity) continue;
        const conflict = entry.attendees.find((occupant) =>
          occupant.dontPairWithIds.includes(attendee.userId) || attendee.dontPairWithIds.includes(occupant.userId),
        );
        if (conflict) continue;
        // Score based on vibe difference and dietary diversity.
        let score = entry.attendees.length * 2;
        if (attendee.vibe !== undefined) {
          const vibeAvg =
            entry.attendees.reduce((sum, current) => sum + (current.vibe ?? attendee.vibe ?? 0), 0) /
              Math.max(entry.attendees.length, 1) || 0;
          score += Math.abs((attendee.vibe ?? vibeAvg) - vibeAvg);
        }
        if (attendee.dietary) {
          const duplicateDietary = entry.attendees.filter((current) => current.dietary === attendee.dietary).length;
          score += duplicateDietary * 3;
        }
        if (score < bestScore) {
          bestScore = score;
          bestSeat = group.id;
        }
      }
      result.set(attendee.id, bestSeat ?? null);
      if (bestSeat) {
        capacityMap.get(bestSeat)!.attendees.push(attendee);
      }
    }

    setAssignments(result);
    setFeedback("Auto-suggested new groupings. Review before saving.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <aside className="space-y-4 rounded-[28px] border border-border/60 bg-background/80 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search attendees</p>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Age</p>
          <div className="flex flex-wrap gap-2">
            {AGE_BUCKETS.map((bucket) => (
              <Button
                key={bucket.value}
                type="button"
                size="sm"
                variant={ageFilter === bucket.value ? "secondary" : "outline"}
                onClick={() => setAgeFilter(bucket.value)}
                className="rounded-full"
              >
                {bucket.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dietary</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={dietaryFilter === "all" ? "secondary" : "outline"}
              onClick={() => setDietaryFilter("all")}
              className="rounded-full"
            >
              Any
            </Button>
            {dietaryOptions.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={dietaryFilter === option ? "secondary" : "outline"}
                onClick={() => setDietaryFilter(option)}
                className="rounded-full"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minimum vibe</p>
          <Input
            type="range"
            min={0}
            max={10}
            step={1}
            value={minVibe}
            onChange={(event) => setMinVibe(Number(event.target.value))}
          />
          <p className="text-xs text-muted-foreground">{minVibe}/10 energy required</p>
        </div>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unassigned pool</p>
            <span className="text-xs text-muted-foreground">{pool.length}</span>
          </div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const attendeeId = event.dataTransfer.getData("text/plain");
              handleDrop(attendeeId, null);
            }}
            className="space-y-2 rounded-2xl border border-dashed border-border/60 bg-background/60 p-3"
          >
            {pool.length === 0 ? (
              <p className="text-xs text-muted-foreground">Everyone is seated. Nice work!</p>
            ) : (
              pool.map((attendee) => (
                <AttendeeCard key={attendee.id} attendee={attendee} />
              ))
            )}
          </div>
        </section>
        <div className="space-y-2">
          <Button type="button" onClick={autoSuggest} className="w-full">
            Auto-suggest groups
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAssignments(new Map(baseline));
              setFeedback(null);
            }}
            className="w-full"
          >
            Reset assignments
          </Button>
        </div>
      </aside>

      <section className="space-y-4">
        {feedback ? (
          <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            {feedback}
          </div>
        ) : null}
        {state.message ? (
          <div
            className={
              state.status === "error"
                ? "rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                : "rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
            }
          >
            {state.message}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {seatGroups.map((group) => (
            <div
              key={group.id}
              className="flex h-full flex-col gap-3 rounded-[28px] border border-border/60 bg-background/80 p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const attendeeId = event.dataTransfer.getData("text/plain");
                handleDrop(attendeeId, group.id);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Table {group.tableNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignedMap.get(group.id)?.length ?? 0}/{group.capacity} seated
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {(assignedMap.get(group.id) ?? []).length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
                    Drop guests here
                  </div>
                ) : (
                  (assignedMap.get(group.id) ?? []).map((attendee) => (
                    <AttendeeCard key={attendee.id} attendee={attendee} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        <form action={submitAssignments} className="flex items-center justify-between rounded-[24px] border border-border/60 bg-background/80 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            {hasChanges ? "Unsaved changes" : "Assignments synced"}
          </div>
          <Button type="submit" disabled={pending || !hasChanges} className="px-6">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function AttendeeCard({ attendee }: { attendee: Attendee }) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", attendee.id);
      }}
      className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs"
    >
      <div>
        <p className="font-semibold text-foreground">{attendee.name}</p>
        <p className="text-muted-foreground">{attendee.email}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {attendee.vibe !== undefined ? (
          <Badge variant="outline" className="bg-muted/60">
            Vibe {attendee.vibe}/10
          </Badge>
        ) : null}
        {attendee.dietary ? (
          <Badge variant="outline" className="bg-muted/60">
            {attendee.dietary}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
