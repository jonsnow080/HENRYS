"use client";

import { useActionState, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationNotes, type ApplicationNotesState } from "./actions";

export function ApplicationNotesDialog({
  applicationId,
  applicantName,
  defaultNotes,
}: {
  applicationId: string;
  applicantName: string;
  defaultNotes: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ApplicationNotesState, FormData>(
    updateApplicationNotes,
    {},
  );

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full px-3 text-xs">
          Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reviewer notes</DialogTitle>
          <DialogDescription>
            Share context with the team about {applicantName}. Notes are only visible to admins.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            formData.append("applicationId", applicationId);
            formAction(formData);
          }}
          className="space-y-4"
        >
          <Textarea
            name="notes"
            defaultValue={defaultNotes}
            rows={6}
            placeholder="Add highlights, concerns, or follow-up ideas."
            className="resize-none"
          />
          {state.message ? (
            <p className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-600"}>
              {state.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="px-6">
              {pending ? "Saving…" : "Save notes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
