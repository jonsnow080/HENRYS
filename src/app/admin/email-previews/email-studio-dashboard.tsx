"use client";

import { useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PerformanceCard = {
  label: string;
  value: string;
  helper: string;
};

type CampaignRow = {
  id: string;
  name: string;
  type: string;
  audience: string;
  sentOn: string;
  opens: string;
  clicks: string;
  status: string;
};

type AutomationRow = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  metric: string;
  status: "Active" | "Paused";
  lastTouched: string;
};

type BaseForm = {
  subject: string;
  previewText: string;
  audience: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  trackOpens: boolean;
  trackClicks: boolean;
};

type OneOffForm = BaseForm & {
  sendDate: string;
  sendTime: string;
  timezone: string;
};

type RecurringForm = BaseForm & {
  frequency: string;
  cadence: string;
  sendTime: string;
  timezone: string;
  startDate: string;
};

type ConditionalForm = BaseForm & {
  trigger: string;
  delay: string;
  exitCriteria: string;
  fallbackChannel: string;
};

type EmailFormState = {
  "one-off": OneOffForm;
  recurring: RecurringForm;
  conditional: ConditionalForm;
};

type EmailType = keyof EmailFormState;

type PreviewSummary = {
  schedule: string;
  tracking: string;
  cta: string;
};

export type EmailStudioDashboardProps = {
  performanceCards: PerformanceCard[];
  recentCampaigns: CampaignRow[];
  automations: AutomationRow[];
};

const emailTypeCopy: Record<EmailType, { label: string; helper: string }> = {
  "one-off": {
    label: "One-off blast",
    helper: "Send once to a targeted audience.",
  },
  recurring: {
    label: "Recurring",
    helper: "Set it and keep your cadence steady.",
  },
  conditional: {
    label: "Conditional trigger",
    helper: "React instantly to member behavior.",
  },
};

const initialForms: EmailFormState = {
  "one-off": {
    subject: "This week's community dinner RSVP",
    previewText: "Grab a seat for Thursday's gathering before we run out",
    audience: "Active members",
    body: "We're gathering this Thursday at the loft for a chef-led community dinner. Spots are limited to 40 members, so grab your seat if you'd love to join.",
    ctaLabel: "Reserve my seat",
    ctaUrl: "https://henrys.club/events/community-dinner",
    trackOpens: true,
    trackClicks: true,
    sendDate: new Date().toISOString().slice(0, 10),
    sendTime: "17:00",
    timezone: "America/Los_Angeles (PT)",
  },
  recurring: {
    subject: "Monthly community digest",
    previewText: "Fresh wins, events, and intros from around the club",
    audience: "Members & alumni",
    body: "Every month we round up standout wins, recommended reads, and introductions that deserve amplification. Let us know what you'd like to see in the next issue!",
    ctaLabel: "Submit a win",
    ctaUrl: "https://henrys.club/forms/share-a-win",
    trackOpens: true,
    trackClicks: true,
    frequency: "Monthly",
    cadence: "First Thursday",
    sendTime: "09:00",
    timezone: "America/Los_Angeles (PT)",
    startDate: new Date().toISOString().slice(0, 10),
  },
  conditional: {
    subject: "Welcome to HENRYS!",
    previewText: "A quick tour of what to do in your first week",
    audience: "New members",
    body: "We're thrilled to welcome you into the community. Here are a few must-dos for your first week so you can meet other members and make the most of your membership right away.",
    ctaLabel: "Explore onboarding",
    ctaUrl: "https://henrys.club/onboarding",
    trackOpens: true,
    trackClicks: true,
    trigger: "Membership approved",
    delay: "Send immediately",
    exitCriteria: "Stop after first event RSVP",
    fallbackChannel: "Send SMS if unopened after 48h",
  },
};

export function EmailStudioDashboard({ performanceCards, recentCampaigns, automations }: EmailStudioDashboardProps) {
  const [selectedType, setSelectedType] = useState<EmailType>("one-off");
  const [forms, setForms] = useState<EmailFormState>(initialForms);

  const currentForm = forms[selectedType];

  const previewSummary: PreviewSummary = useMemo(() => {
    if (selectedType === "one-off" && "sendDate" in currentForm) {
      const schedule = currentForm.sendDate
        ? `Scheduled for ${formatReadableDate(currentForm.sendDate)} at ${formatTime(currentForm.sendTime)} ${currentForm.timezone}`
        : "Schedule when you're ready to send";
      return {
        schedule,
        tracking: trackingSummary(currentForm.trackOpens, currentForm.trackClicks),
        cta: `${currentForm.ctaLabel} → ${currentForm.ctaUrl}`,
      };
    }

    if (selectedType === "recurring" && "frequency" in currentForm) {
      const schedule = `${currentForm.frequency} on ${currentForm.cadence} · ${formatTime(currentForm.sendTime)} ${currentForm.timezone}`;
      return {
        schedule,
        tracking: trackingSummary(currentForm.trackOpens, currentForm.trackClicks),
        cta: `${currentForm.ctaLabel} → ${currentForm.ctaUrl}`,
      };
    }

    if (selectedType === "conditional" && "trigger" in currentForm) {
      const schedule = `${currentForm.trigger} · ${currentForm.delay}`;
      return {
        schedule,
        tracking: `${trackingSummary(currentForm.trackOpens, currentForm.trackClicks)} · ${currentForm.fallbackChannel}`,
        cta: `${currentForm.ctaLabel} → ${currentForm.ctaUrl}`,
      };
    }

    return {
      schedule: "",
      tracking: "",
      cta: "",
    };
  }, [currentForm, selectedType]);

  const groupedCampaigns = useMemo(() => {
    const groups: Record<string, CampaignRow[]> = {
      "One-off": [],
      Recurring: [],
      Conditional: [],
    };

    for (const campaign of recentCampaigns) {
      if (groups[campaign.type]) {
        groups[campaign.type].push(campaign);
      } else {
        groups["One-off"].push(campaign);
      }
    }

    return groups;
  }, [recentCampaigns]);

  function updateFormField(field: string, value: string | boolean) {
    setForms((previous) => {
      const next = { ...previous };
      const current = { ...next[selectedType] } as Record<string, string | boolean>;
      current[field] = value;
      next[selectedType] = current as EmailFormState[EmailType];
      return next;
    });
  }

  const variants: Array<{
    id: string;
    name: string;
    description: string;
    wrapperClass: string;
  }> = [
    {
      id: "concept-a",
      name: "Concept A · Campaign cockpit",
      description: "A balanced hub for day-to-day operations with clear metrics, the builder, and automation monitors all within reach.",
      wrapperClass: "rounded-3xl border border-border/60 bg-background/95 p-6 sm:p-8 shadow-sm",
    },
    {
      id: "concept-b",
      name: "Concept B · Analytics canvas",
      description: "A glassmorphism-inspired layout focused on visual performance storytelling with the composer floating alongside insights.",
      wrapperClass:
        "rounded-3xl bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50/70 p-6 sm:p-10 ring-1 ring-border/40 backdrop-blur",
    },
    {
      id: "concept-c",
      name: "Concept C · Lifecycle board",
      description: "A kanban-style experience that organizes sends by lifecycle stage so you can tune journeys while crafting new touchpoints.",
      wrapperClass: "rounded-3xl border border-muted/50 bg-muted/20 p-6 sm:p-8",
    },
    {
      id: "concept-d",
      name: "Concept D · Minimal timeline",
      description: "A lightweight, editorial layout centered on a chronological narrative with inline controls for quick edits and reviews.",
      wrapperClass: "rounded-3xl border-2 border-dashed border-border/70 bg-background/80 p-6 sm:p-10",
    },
  ];

  function renderVariant(variantId: string) {
    switch (variantId) {
      case "concept-a":
        return (
          <div className="flex flex-col gap-8">
            <PerformanceTiles cards={performanceCards} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <ComposerCard
                idPrefix="concept-a"
                className="border-border/70 bg-card/80"
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                currentForm={currentForm}
                updateFormField={updateFormField}
              />

              <div className="flex flex-col gap-4">
                <PreviewCard
                  selectedType={selectedType}
                  currentForm={currentForm}
                  previewSummary={previewSummary}
                  className="border-border/70 bg-background"
                />
                <AudienceSnapshotCard
                  currentForm={currentForm}
                  className="border-border/70 bg-card/80"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <CampaignTableCard
                recentCampaigns={recentCampaigns}
                className="border-border/70 bg-card/80"
              />
              <AutomationListCard
                automations={automations}
                className="border-border/70 bg-card/80"
              />
            </div>
          </div>
        );
      case "concept-b":
        return (
          <div className="space-y-8">
            <PerformanceStrip cards={performanceCards} />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-6">
                <PreviewCard
                  selectedType={selectedType}
                  currentForm={currentForm}
                  previewSummary={previewSummary}
                  className="border-white/60 bg-white/80 shadow-xl"
                  badgeVariant="default"
                  innerPreviewClassName="border-white/60 bg-white"
                  footerButtonVariant="secondary"
                />
                <InsightsCluster cards={performanceCards} />
                <JourneyTimeline
                  recentCampaigns={recentCampaigns}
                  automations={automations}
                  className="border-white/60 bg-white/80 shadow-sm"
                />
              </div>

              <div className="space-y-6">
                <ComposerCard
                  idPrefix="concept-b"
                  className="border-white/60 bg-white/90 shadow-xl backdrop-blur"
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  currentForm={currentForm}
                  updateFormField={updateFormField}
                  toggleActiveClassName="border-transparent bg-gradient-to-r from-purple-500 to-sky-500 text-white shadow-md"
                  toggleInactiveClassName="border-purple-200/80 bg-white/70 text-purple-800 hover:border-purple-400 hover:text-purple-900"
                  helperClassName="text-purple-700/80"
                  buttonAccentClassName="bg-gradient-to-r from-purple-500 to-sky-500 text-white border-none shadow-lg"
                  buttonSubtleVariant="ghost"
                />
                <AudienceSnapshotCard
                  currentForm={currentForm}
                  className="border-white/60 bg-white/80 shadow"
                  headlineClassName="text-purple-900"
                  metricTone="text-purple-700"
                />
              </div>
            </div>

            <CampaignTableCard
              recentCampaigns={recentCampaigns}
              className="border-white/60 bg-white/80 shadow"
              headerButtonVariant="secondary"
            />

            <AutomationListCard
              automations={automations}
              className="border-white/60 bg-white/80 shadow"
              badgeVariant="default"
            />
          </div>
        );
      case "concept-c":
        return (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="space-y-6">
              <ComposerCard
                idPrefix="concept-c"
                className="border-dashed border-primary/40 bg-white/90 shadow-sm"
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                currentForm={currentForm}
                updateFormField={updateFormField}
                toggleActiveClassName="border-primary bg-primary text-primary-foreground shadow-sm"
                toggleInactiveClassName="border-primary/40 bg-transparent text-primary hover:bg-primary/10"
                buttonAccentClassName="bg-primary text-primary-foreground border-none"
                helperClassName="text-primary"
              />
              <AudienceSnapshotCard
                currentForm={currentForm}
                className="border-dashed border-primary/40 bg-white/90 shadow-sm"
                metricTone="text-primary"
              />
              <AutomationListCard
                automations={automations}
                className="border-dashed border-primary/40 bg-white/90 shadow-sm"
                badgeVariant="secondary"
              />
            </div>

            <LifecycleBoard groupedCampaigns={groupedCampaigns} automations={automations} />
          </div>
        );
      case "concept-d":
        return (
          <div className="space-y-10">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <ComposerCard
                idPrefix="concept-d"
                className="border-dashed border-border/70 bg-background/90 shadow-none"
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                currentForm={currentForm}
                updateFormField={updateFormField}
                toggleActiveClassName="border-border bg-foreground text-background"
                toggleInactiveClassName="border-dashed border-border bg-transparent text-foreground hover:bg-foreground/10"
                buttonAccentClassName="bg-foreground text-background"
                buttonSubtleVariant="outline"
              />

              <div className="space-y-6">
                <PerformanceTiles
                  cards={performanceCards}
                  containerClassName="grid gap-3 sm:grid-cols-2"
                  cardClassName="border-dashed border-border/70 bg-background/70"
                  valueClassName="text-3xl font-semibold"
                  helperClassName="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                />
                <PreviewCard
                  selectedType={selectedType}
                  currentForm={currentForm}
                  previewSummary={previewSummary}
                  className="border-dashed border-border/70 bg-background/70 shadow-none"
                  innerPreviewClassName="border-dashed border-border/70 bg-white"
                  footerButtonVariant="outline"
                />
              </div>
            </div>

            <JourneyTimeline
              recentCampaigns={recentCampaigns}
              automations={automations}
              className="border-dashed border-border/70 bg-background/70"
              accentColor="bg-foreground"
            />

            <CampaignTableCard
              recentCampaigns={recentCampaigns}
              className="border-dashed border-border/70 bg-background/70 shadow-none"
              headerButtonVariant="ghost"
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-12">
      {variants.map((variant) => (
        <section key={variant.id} className="space-y-6">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Dashboard exploration</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-2xl font-semibold sm:text-3xl">{variant.name}</h2>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{variant.description}</p>
            </div>
          </header>
          <div className={cn("space-y-8", variant.wrapperClass)}>{renderVariant(variant.id)}</div>
        </section>
      ))}
    </div>
  );
}

type ComposerCardProps = {
  idPrefix: string;
  selectedType: EmailType;
  setSelectedType: (type: EmailType) => void;
  currentForm: EmailFormState[EmailType];
  updateFormField: (field: string, value: string | boolean) => void;
  className?: string;
  toggleActiveClassName?: string;
  toggleInactiveClassName?: string;
  helperClassName?: string;
  buttonAccentClassName?: string;
  buttonSubtleVariant?: ComponentProps<typeof Button>["variant"];
};

function ComposerCard({
  idPrefix,
  selectedType,
  setSelectedType,
  currentForm,
  updateFormField,
  className,
  toggleActiveClassName,
  toggleInactiveClassName,
  helperClassName,
  buttonAccentClassName,
  buttonSubtleVariant = "outline",
}: ComposerCardProps) {
  const fieldId = (field: string) => `${idPrefix}-${field}`;

  return (
    <Card className={cn("border-border/70 bg-card/80", className)}>
      <CardHeader className="gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Email builder</CardTitle>
          <CardDescription>
            Choose a send type and craft content that feels right for your members.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(emailTypeCopy) as EmailType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                selectedType === type
                  ? toggleActiveClassName ?? "border-foreground bg-foreground text-background shadow-sm"
                  : toggleInactiveClassName ?? "border-border/70 bg-background/70 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {emailTypeCopy[type].label}
            </button>
          ))}
        </div>
        <p className={cn("text-sm text-muted-foreground", helperClassName)}>{emailTypeCopy[selectedType].helper}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("subject")}>Subject line</Label>
            <Input
              id={fieldId("subject")}
              value={currentForm.subject}
              onChange={(event) => updateFormField("subject", event.target.value)}
              placeholder="Subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("previewText")}>Preview text</Label>
            <Input
              id={fieldId("previewText")}
              value={currentForm.previewText}
              onChange={(event) => updateFormField("previewText", event.target.value)}
              placeholder="Preview copy"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("audience")}>Audience</Label>
          <Select value={currentForm.audience} onValueChange={(value) => updateFormField("audience", value)}>
            <SelectTrigger id={fieldId("audience")}>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active members">Active members</SelectItem>
              <SelectItem value="Members & alumni">Members & alumni</SelectItem>
              <SelectItem value="Prospective members">Prospective members</SelectItem>
              <SelectItem value="Hosts only">Hosts only</SelectItem>
              <SelectItem value="New members">New members</SelectItem>
              <SelectItem value="RSVP’d members">RSVP’d members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedType === "one-off" && "sendDate" in currentForm ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={fieldId("sendDate")}>Send date</Label>
              <Input
                id={fieldId("sendDate")}
                type="date"
                value={currentForm.sendDate}
                onChange={(event) => updateFormField("sendDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("sendTime")}>Send time</Label>
              <Input
                id={fieldId("sendTime")}
                type="time"
                value={currentForm.sendTime}
                onChange={(event) => updateFormField("sendTime", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("timezone")}>Timezone</Label>
              <Select value={currentForm.timezone} onValueChange={(value) => updateFormField("timezone", value)}>
                <SelectTrigger id={fieldId("timezone")}>
                  <SelectValue placeholder="Timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles (PT)">Pacific</SelectItem>
                  <SelectItem value="America/New_York (ET)">Eastern</SelectItem>
                  <SelectItem value="Europe/London (GMT)">London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {selectedType === "recurring" && "frequency" in currentForm ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={fieldId("frequency")}>Frequency</Label>
              <Select value={currentForm.frequency} onValueChange={(value) => updateFormField("frequency", value)}>
                <SelectTrigger id={fieldId("frequency")}>
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("cadence")}>Cadence</Label>
              <Select value={currentForm.cadence} onValueChange={(value) => updateFormField("cadence", value)}>
                <SelectTrigger id={fieldId("cadence")}>
                  <SelectValue placeholder="Cadence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Every Monday">Every Monday</SelectItem>
                  <SelectItem value="First Thursday">First Thursday</SelectItem>
                  <SelectItem value="Last Friday">Last Friday</SelectItem>
                  <SelectItem value="1st of the month">1st of the month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("recurringTime")}>Send time</Label>
              <Input
                id={fieldId("recurringTime")}
                type="time"
                value={currentForm.sendTime}
                onChange={(event) => updateFormField("sendTime", event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={fieldId("recurringTimezone")}>Timezone</Label>
              <Select value={currentForm.timezone} onValueChange={(value) => updateFormField("timezone", value)}>
                <SelectTrigger id={fieldId("recurringTimezone")}>
                  <SelectValue placeholder="Timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles (PT)">Pacific</SelectItem>
                  <SelectItem value="America/New_York (ET)">Eastern</SelectItem>
                  <SelectItem value="Europe/London (GMT)">London</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("startDate")}>Start date</Label>
              <Input
                id={fieldId("startDate")}
                type="date"
                value={currentForm.startDate}
                onChange={(event) => updateFormField("startDate", event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {selectedType === "conditional" && "trigger" in currentForm ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={fieldId("trigger")}>Trigger</Label>
              <Select value={currentForm.trigger} onValueChange={(value) => updateFormField("trigger", value)}>
                <SelectTrigger id={fieldId("trigger")}>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Membership approved">Membership approved</SelectItem>
                  <SelectItem value="Application submitted">Application submitted</SelectItem>
                  <SelectItem value="Attended first event">Attended first event</SelectItem>
                  <SelectItem value="Renewal upcoming">Renewal upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("delay")}>Delay</Label>
              <Select value={currentForm.delay} onValueChange={(value) => updateFormField("delay", value)}>
                <SelectTrigger id={fieldId("delay")}>
                  <SelectValue placeholder="Select delay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Send immediately">Send immediately</SelectItem>
                  <SelectItem value="After 1 hour">After 1 hour</SelectItem>
                  <SelectItem value="After 24 hours">After 24 hours</SelectItem>
                  <SelectItem value="After 3 days">After 3 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("exitCriteria")}>Exit criteria</Label>
              <Input
                id={fieldId("exitCriteria")}
                value={currentForm.exitCriteria}
                onChange={(event) => updateFormField("exitCriteria", event.target.value)}
                placeholder="Stop sending when..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId("fallbackChannel")}>Fallback channel</Label>
              <Input
                id={fieldId("fallbackChannel")}
                value={currentForm.fallbackChannel}
                onChange={(event) => updateFormField("fallbackChannel", event.target.value)}
                placeholder="Optional backup outreach"
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={fieldId("body")}>Main content</Label>
          <Textarea
            id={fieldId("body")}
            value={currentForm.body}
            onChange={(event) => updateFormField("body", event.target.value)}
            placeholder="Write the body of your email"
            rows={6}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("ctaLabel")}>Call-to-action label</Label>
            <Input
              id={fieldId("ctaLabel")}
              value={currentForm.ctaLabel}
              onChange={(event) => updateFormField("ctaLabel", event.target.value)}
              placeholder="Button copy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("ctaUrl")}>Call-to-action link</Label>
            <Input
              id={fieldId("ctaUrl")}
              value={currentForm.ctaUrl}
              onChange={(event) => updateFormField("ctaUrl", event.target.value)}
              placeholder="https://"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Track opens</p>
              <p className="text-xs text-muted-foreground">Keep an eye on deliverability health.</p>
            </div>
            <Switch
              id={fieldId("trackOpens")}
              checked={currentForm.trackOpens}
              onCheckedChange={(checked) => updateFormField("trackOpens", checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Track clicks</p>
              <p className="text-xs text-muted-foreground">Measure engagement on your CTA.</p>
            </div>
            <Switch
              id={fieldId("trackClicks")}
              checked={currentForm.trackClicks}
              onCheckedChange={(checked) => updateFormField("trackClicks", checked)}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant={buttonSubtleVariant} className="rounded-full px-6">
            Save draft
          </Button>
          <Button className={cn("rounded-full px-6", buttonAccentClassName)}>
            Generate preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type PreviewCardProps = {
  selectedType: EmailType;
  currentForm: EmailFormState[EmailType];
  previewSummary: PreviewSummary;
  className?: string;
  innerPreviewClassName?: string;
  badgeVariant?: ComponentProps<typeof Badge>["variant"];
  footerButtonVariant?: ComponentProps<typeof Button>["variant"];
};

function PreviewCard({
  selectedType,
  currentForm,
  previewSummary,
  className,
  innerPreviewClassName,
  badgeVariant = "accent",
  footerButtonVariant = "ghost",
}: PreviewCardProps) {
  return (
    <Card className={cn("border-border/70 bg-background", className)}>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Live preview</CardTitle>
          <Badge variant={badgeVariant} className="uppercase tracking-wide">
            {emailTypeCopy[selectedType].label}
          </Badge>
        </div>
        <CardDescription>See how the experience comes together for members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className={cn(
            "rounded-2xl border border-border/60 bg-white p-6 shadow-inner",
            innerPreviewClassName,
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Subject</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{currentForm.subject}</p>
          <p className="mt-1 text-sm text-muted-foreground">{currentForm.previewText}</p>
          <div className="mt-5 space-y-4 text-sm text-muted-foreground">
            <p>{currentForm.body}</p>
            <div className="rounded-xl bg-foreground px-4 py-3 text-center text-sm font-semibold text-background">
              {currentForm.ctaLabel}
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">Send plan</p>
          <p className="text-muted-foreground">{previewSummary.schedule}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">Tracking</p>
          <p className="text-muted-foreground">{previewSummary.tracking}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">CTA destination</p>
          <p className="break-all text-muted-foreground">{previewSummary.cta}</p>
        </div>
        <Button variant={footerButtonVariant} className="w-full rounded-full border border-border/60 px-6">
          Send test email
        </Button>
      </CardContent>
    </Card>
  );
}

type AudienceSnapshotCardProps = {
  currentForm: EmailFormState[EmailType];
  className?: string;
  headlineClassName?: string;
  metricTone?: string;
};

function AudienceSnapshotCard({
  currentForm,
  className,
  headlineClassName,
  metricTone,
}: AudienceSnapshotCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/80", className)}>
      <CardHeader className="gap-2">
        <CardTitle className={cn("text-lg", headlineClassName)}>Audience snapshot</CardTitle>
        <CardDescription>
          Recent engagement for {currentForm.audience.toLowerCase()} to help calibrate expectations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <MetricRow label="Average open rate" value="69%" valueClassName={metricTone} />
        <MetricRow label="Average click rate" value="25%" valueClassName={metricTone} />
        <MetricRow label="Active subscribers" value="2,140" valueClassName={metricTone} />
      </CardContent>
    </Card>
  );
}

type CampaignTableCardProps = {
  recentCampaigns: CampaignRow[];
  className?: string;
  headerButtonVariant?: ComponentProps<typeof Button>["variant"];
};

function CampaignTableCard({
  recentCampaigns,
  className,
  headerButtonVariant = "ghost",
}: CampaignTableCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/80", className)}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">Recent performance</CardTitle>
          <CardDescription>Compare reach and engagement across the last sends.</CardDescription>
        </div>
        <Button variant={headerButtonVariant} className="rounded-full px-4">
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Opens</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                <TableCell>{campaign.type}</TableCell>
                <TableCell>{campaign.audience}</TableCell>
                <TableCell>{campaign.sentOn}</TableCell>
                <TableCell className="text-right">{campaign.opens}</TableCell>
                <TableCell className="text-right">{campaign.clicks}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={campaign.status === "Paused" ? "outline" : "muted"}>{campaign.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type AutomationListCardProps = {
  automations: AutomationRow[];
  className?: string;
  badgeVariant?: ComponentProps<typeof Badge>["variant"];
};

function AutomationListCard({ automations, className, badgeVariant = "accent" }: AutomationListCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/80", className)}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">Automation playbooks</CardTitle>
          <CardDescription>Monitor which behavioral journeys are live and where to optimize.</CardDescription>
        </div>
        <Button variant="ghost" className="rounded-full px-4">
          New automation
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{automation.name}</p>
              <Badge variant={automation.status === "Active" ? badgeVariant : "outline"}>{automation.status}</Badge>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trigger</p>
            <p className="text-sm text-foreground">{automation.trigger}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Action</p>
            <p className="text-sm text-foreground">{automation.action}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{automation.metric}</span>
              <span>{automation.lastTouched}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type PerformanceTilesProps = {
  cards: PerformanceCard[];
  containerClassName?: string;
  cardClassName?: string;
  valueClassName?: string;
  helperClassName?: string;
};

function PerformanceTiles({
  cards,
  containerClassName,
  cardClassName,
  valueClassName,
  helperClassName,
}: PerformanceTilesProps) {
  return (
    <section className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", containerClassName)}>
      {cards.map((card) => (
        <Card key={card.label} className={cn("border-border/60 bg-background/80", cardClassName)}>
          <CardHeader className="gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            <p className={cn("text-3xl font-semibold text-foreground", valueClassName)}>{card.value}</p>
            <CardDescription className={helperClassName}>{card.helper}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

type PerformanceStripProps = {
  cards: PerformanceCard[];
};

function PerformanceStrip({ cards }: PerformanceStripProps) {
  return (
    <section className="flex flex-wrap items-stretch gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex min-w-[200px] flex-1 flex-col justify-between rounded-2xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-600/80">{card.label}</span>
          <span className="text-3xl font-semibold text-purple-900">{card.value}</span>
          <span className="text-sm text-purple-700/80">{card.helper}</span>
        </div>
      ))}
    </section>
  );
}

type InsightsClusterProps = {
  cards: PerformanceCard[];
};

function InsightsCluster({ cards }: InsightsClusterProps) {
  return (
    <Card className="border-white/60 bg-white/80 shadow-sm">
      <CardHeader className="gap-2">
        <CardTitle className="text-lg text-purple-900">Highlights</CardTitle>
        <CardDescription className="text-purple-700/80">
          Snapshot of standout metrics from the last thirty days.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={`insight-${card.label}`} className="rounded-2xl border border-purple-200/70 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-500/80">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-purple-900">{card.value}</p>
            <p className="text-sm text-purple-700/80">{card.helper}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type JourneyTimelineProps = {
  recentCampaigns: CampaignRow[];
  automations: AutomationRow[];
  className?: string;
  accentColor?: string;
};

function JourneyTimeline({ recentCampaigns, automations, className, accentColor = "bg-purple-500" }: JourneyTimelineProps) {
  const events = [...recentCampaigns].map((campaign) => ({
    id: `campaign-${campaign.id}`,
    title: campaign.name,
    subtitle: `${campaign.type} · ${campaign.audience}`,
    meta: `${campaign.sentOn} · Opens ${campaign.opens} · Clicks ${campaign.clicks}`,
  }));

  automations.forEach((automation) => {
    events.push({
      id: `automation-${automation.id}`,
      title: automation.name,
      subtitle: automation.trigger,
      meta: `${automation.status} · ${automation.metric}`,
    });
  });

  return (
    <Card className={cn("border-border/70 bg-background/80", className)}>
      <CardHeader className="gap-2">
        <CardTitle className="text-lg">Journey timeline</CardTitle>
        <CardDescription>Blend broadcast milestones with automation checkpoints.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-8">
              <div className={cn("absolute left-0 top-1 h-3 w-3 rounded-full", accentColor)} />
              {index !== events.length - 1 ? (
                <span className="absolute left-[5px] top-4 h-full w-px bg-border" aria-hidden />
              ) : null}
              <p className="text-sm font-semibold text-foreground">{event.title}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{event.subtitle}</p>
              <p className="text-sm text-muted-foreground">{event.meta}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type LifecycleBoardProps = {
  groupedCampaigns: Record<string, CampaignRow[]>;
  automations: AutomationRow[];
};

function LifecycleBoard({ groupedCampaigns, automations }: LifecycleBoardProps) {
  const columns: Array<{
    id: string;
    title: string;
    helper: string;
    campaigns: CampaignRow[];
  }> = [
    {
      id: "concept-c-awareness",
      title: "Awareness",
      helper: "One-off spotlights & announcements",
      campaigns: groupedCampaigns["One-off"],
    },
    {
      id: "concept-c-nurture",
      title: "Nurture",
      helper: "Recurring cadences",
      campaigns: groupedCampaigns["Recurring"],
    },
    {
      id: "concept-c-activation",
      title: "Activation",
      helper: "Conditional journeys",
      campaigns: groupedCampaigns["Conditional"],
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-white/90 p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">{column.title}</p>
            <p className="text-sm text-primary/80">{column.helper}</p>
          </div>
          <div className="space-y-4">
            {column.campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-primary/30 bg-white/80 p-4">
                <p className="text-sm font-semibold text-primary">{campaign.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60">{campaign.type} · {campaign.audience}</p>
                <p className="text-sm text-primary/80">Sent {campaign.sentOn}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-primary/70">
                  <span>Opens {campaign.opens}</span>
                  <span>Clicks {campaign.clicks}</span>
                </div>
              </div>
            ))}
            {column.campaigns.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-primary/40 bg-white/60 p-4 text-sm text-primary/60">
                No sends logged yet — perfect spot for your next idea.
              </p>
            ) : null}
          </div>
        </div>
      ))}
      <div className="lg:col-span-3">
        <Card className="border-primary/30 bg-white/90 shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-lg text-primary">Automation status</CardTitle>
            <CardDescription className="text-primary/80">
              Fast view of journey health to pair with lifecycle planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {automations.map((automation) => (
              <div key={`automation-summary-${automation.id}`} className="rounded-2xl border border-primary/20 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">{automation.name}</p>
                  <Badge variant={automation.status === "Active" ? "secondary" : "outline"}>{automation.status}</Badge>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60">{automation.trigger}</p>
                <p className="text-sm text-primary/80">{automation.metric}</p>
                <p className="text-xs text-primary/60">{automation.lastTouched}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type MetricRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function MetricRow({ label, value, valueClassName }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={cn("font-semibold text-foreground", valueClassName)}>{value}</span>
    </div>
  );
}

function formatReadableDate(value: string) {
  if (!value) return "Choose a date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "Set a time";
  const [hours, minutes] = value.split(":");
  if (!hours || !minutes) return value;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function trackingSummary(trackOpens: boolean, trackClicks: boolean) {
  if (trackOpens && trackClicks) {
    return "Tracking opens & clicks";
  }
  if (trackOpens) {
    return "Tracking opens";
  }
  if (trackClicks) {
    return "Tracking clicks";
  }
  return "Tracking disabled";
}
