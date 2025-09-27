"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  sendApplicationDecisionEmail,
  type ApplicationEmailState,
  type DecisionTemplateOption,
} from "./actions";

export type ApplicationEmailPreview = {
  template: DecisionTemplateOption;
  subject: string;
  html: string;
};

const TEMPLATE_LABELS: Record<DecisionTemplateOption, string> = {
  APPROVED: "Approved invite",
  WAITLIST: "Waitlist update",
  REJECTED: "Pass kindly",
};

export function ApplicationEmailDialog({
  applicationId,
  applicantName,
  previews,
}: {
  applicationId: string;
  applicantName: string;
  previews: ApplicationEmailPreview[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DecisionTemplateOption>(previews[0]?.template ?? "WAITLIST");
  const [state, formAction, pending] = useActionState<ApplicationEmailState, FormData>(
    sendApplicationDecisionEmail,
    {},
  );

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  const activePreview = useMemo(
    () => previews.find((preview) => preview.template === selectedTemplate) ?? previews[0],
    [previews, selectedTemplate],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full px-3 text-xs">
          Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Send decision email</DialogTitle>
          <DialogDescription>
            Preview and send a follow-up email to {applicantName}. All emails send from the ops inbox.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/40 p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Template</p>
              <Select
                value={selectedTemplate}
                onValueChange={(value) => setSelectedTemplate(value as DecisionTemplateOption)}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {previews.map((preview) => (
                    <SelectItem key={preview.template} value={preview.template}>
                      {TEMPLATE_LABELS[preview.template]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
              <p className="mt-1 text-sm font-medium text-foreground">{activePreview?.subject}</p>
            </div>
            {state.message ? (
              <p className={state.status === "error" ? "text-xs text-destructive" : "text-xs text-emerald-600"}>
                {state.message}
              </p>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-background">
            <div
              className="max-h-[520px] overflow-auto bg-white p-6"
              dangerouslySetInnerHTML={{ __html: activePreview?.html ?? "" }}
            />
          </div>
        </div>
        <form
          action={(formData) => {
            formData.append("applicationId", applicationId);
            formData.append("template", selectedTemplate);
            formAction(formData);
          }}
        >
          <DialogFooter>
            <Button type="submit" disabled={pending} className="px-6">
              {pending ? "Sending…" : "Send email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
