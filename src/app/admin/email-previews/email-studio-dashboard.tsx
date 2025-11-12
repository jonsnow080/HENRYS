"use client";

import { useMemo, useState } from "react";
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

export type EmailStudioVisualVariant = "command-center" | "aurora" | "split" | "minimal";

const variantSurfaces: Record<EmailStudioVisualVariant, { builder: string; preview: string; summary: string }> = {
  "command-center": {
    builder: "border-border/70 bg-card/80",
    preview: "border-border/70 bg-background",
    summary: "border-border/60 bg-card/70",
  },
  aurora: {
    builder:
      "border-white/50 bg-white/80 shadow-lg supports-[backdrop-filter]:backdrop-blur-xl backdrop-blur md:border-white/40",
    preview:
      "border-white/60 bg-gradient-to-br from-white/90 via-white/70 to-white/50 shadow-xl supports-[backdrop-filter]:backdrop-blur-xl backdrop-blur",
    summary: "border-white/50 bg-white/80 supports-[backdrop-filter]:backdrop-blur-xl backdrop-blur",
  },
  split: {
    builder: "border-border/60 bg-background",
    preview: "border-border/60 bg-card/70",
    summary: "border-border/50 bg-background/70",
  },
  minimal: {
    builder: "border-dashed border-border/70 bg-background",
    preview: "border-dashed border-border/60 bg-white",
    summary: "border-dashed border-border/60 bg-background",
  },
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

export type EmailStudioDashboardProps = {
  performanceCards: PerformanceCard[];
  recentCampaigns: CampaignRow[];
  automations: AutomationRow[];
  visualVariant?: EmailStudioVisualVariant;
};

export function EmailStudioDashboard({
  performanceCards,
  recentCampaigns,
  automations,
  visualVariant = "command-center",
}: EmailStudioDashboardProps) {
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

  function updateFormField(field: string, value: string | boolean) {
    setForms((previous) => {
      const next = { ...previous };
      const current = { ...next[selectedType] } as Record<string, string | boolean>;
      current[field] = value;
      next[selectedType] = current as EmailFormState[EmailType];
      return next;
    });
  }

  const surfaces = variantSurfaces[visualVariant];

  const builderCard = (
    <Card className={cn("border transition-all", surfaces.builder)}>
      <CardHeader className="gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Email builder</CardTitle>
          <CardDescription>Choose a send type and craft content that feels right for your members.</CardDescription>
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
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-border/70 bg-background/70 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {emailTypeCopy[type].label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{emailTypeCopy[selectedType].helper}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject line</Label>
            <Input
              id="subject"
              value={currentForm.subject}
              onChange={(event) => updateFormField("subject", event.target.value)}
              placeholder="Subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="previewText">Preview text</Label>
            <Input
              id="previewText"
              value={currentForm.previewText}
              onChange={(event) => updateFormField("previewText", event.target.value)}
              placeholder="Preview copy"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">Audience</Label>
          <Select value={currentForm.audience} onValueChange={(value) => updateFormField("audience", value)}>
            <SelectTrigger id="audience">
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
              <Label htmlFor="sendDate">Send date</Label>
              <Input
                id="sendDate"
                type="date"
                value={currentForm.sendDate}
                onChange={(event) => updateFormField("sendDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendTime">Send time</Label>
              <Input
                id="sendTime"
                type="time"
                value={currentForm.sendTime}
                onChange={(event) => updateFormField("sendTime", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={currentForm.timezone} onValueChange={(value) => updateFormField("timezone", value)}>
                <SelectTrigger id="timezone">
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
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={currentForm.frequency} onValueChange={(value) => updateFormField("frequency", value)}>
                <SelectTrigger id="frequency">
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
              <Label htmlFor="cadence">Cadence</Label>
              <Select value={currentForm.cadence} onValueChange={(value) => updateFormField("cadence", value)}>
                <SelectTrigger id="cadence">
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
              <Label htmlFor="recurringTime">Send time</Label>
              <Input
                id="recurringTime"
                type="time"
                value={currentForm.sendTime}
                onChange={(event) => updateFormField("sendTime", event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="recurringTimezone">Timezone</Label>
              <Select value={currentForm.timezone} onValueChange={(value) => updateFormField("timezone", value)}>
                <SelectTrigger id="recurringTimezone">
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
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
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
              <Label htmlFor="trigger">Trigger</Label>
              <Select value={currentForm.trigger} onValueChange={(value) => updateFormField("trigger", value)}>
                <SelectTrigger id="trigger">
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
              <Label htmlFor="delay">Delay</Label>
              <Select value={currentForm.delay} onValueChange={(value) => updateFormField("delay", value)}>
                <SelectTrigger id="delay">
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
              <Label htmlFor="exitCriteria">Exit criteria</Label>
              <Input
                id="exitCriteria"
                value={currentForm.exitCriteria}
                onChange={(event) => updateFormField("exitCriteria", event.target.value)}
                placeholder="Stop sending when..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallbackChannel">Fallback channel</Label>
              <Input
                id="fallbackChannel"
                value={currentForm.fallbackChannel}
                onChange={(event) => updateFormField("fallbackChannel", event.target.value)}
                placeholder="Optional backup outreach"
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="body">Main content</Label>
          <Textarea
            id="body"
            value={currentForm.body}
            onChange={(event) => updateFormField("body", event.target.value)}
            placeholder="Write the body of your email"
            rows={6}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Track opens</p>
              <p className="text-xs text-muted-foreground">Keep an eye on deliverability health.</p>
            </div>
            <Switch checked={currentForm.trackOpens} onCheckedChange={(checked) => updateFormField("trackOpens", checked)} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Track clicks</p>
              <p className="text-xs text-muted-foreground">Measure engagement on your CTA.</p>
            </div>
            <Switch checked={currentForm.trackClicks} onCheckedChange={(checked) => updateFormField("trackClicks", checked)} />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="outline" className="rounded-full px-6">
            Save draft
          </Button>
          <Button className="rounded-full px-6">Generate preview</Button>
        </div>
      </CardContent>
    </Card>
  );

  const previewCard = (
    <Card className={cn("border transition-all", surfaces.preview)}>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Live preview</CardTitle>
          <Badge variant="accent" className="uppercase tracking-wide">
            {emailTypeCopy[selectedType].label}
          </Badge>
        </div>
        <CardDescription>See how the experience comes together for members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-inner">
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

        <div className={cn("rounded-2xl border p-5", surfaces.summary)}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Send summary</p>
          <div className="mt-3 space-y-3 text-sm text-foreground">
            <div>
              <p className="text-xs text-muted-foreground">Schedule</p>
              <p className="font-medium">{previewSummary.schedule}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tracking</p>
              <p className="font-medium">{previewSummary.tracking}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Primary CTA</p>
              <p className="font-medium">{previewSummary.cta}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-5 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Active subscribers</span>
            <span className="font-semibold text-foreground">2,140</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Segment quality</span>
            <span className="font-semibold text-foreground">A-</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Average deliverability</span>
            <span className="font-semibold text-foreground">99.1%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const commandCenterPerformance = (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {performanceCards.map((card) => (
        <Card key={card.label} className="border-border/60 bg-background/80">
          <CardHeader className="gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            <p className="text-3xl font-semibold text-foreground">{card.value}</p>
            <CardDescription>{card.helper}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );

  const commandCenterDetails = (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Recent performance</CardTitle>
            <CardDescription>Compare reach and engagement across the last sends.</CardDescription>
          </div>
          <Button variant="ghost" className="rounded-full px-4">
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

      <Card className="border-border/70 bg-card/80">
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
            <div key={automation.id} className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{automation.name}</p>
                <Badge variant={automation.status === "Active" ? "accent" : "outline"}>{automation.status}</Badge>
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
    </section>
  );

  if (visualVariant === "command-center") {
    return (
      <div className="flex flex-col gap-10">
        {commandCenterPerformance}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          {builderCard}
          <div className="flex flex-col gap-4">{previewCard}</div>
        </section>
        {commandCenterDetails}
      </div>
    );
  }

  if (visualVariant === "aurora") {
    return (
      <div className="flex flex-col gap-10">
        <section className="relative overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-100 via-white to-blue-100 p-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_60%)]" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-700/70">Momentum snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">High-performing campaigns</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {performanceCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-600/70">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-1 text-sm text-slate-600">{card.helper}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-white/50 bg-white/70 p-6 shadow-inner backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-600/70">Automation pulse</p>
                <div className="mt-4 space-y-4">
                  {automations.slice(0, 3).map((automation) => (
                    <div key={automation.id} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{automation.name}</p>
                        <p className="text-xs text-slate-600">{automation.trigger}</p>
                      </div>
                      <Badge className="rounded-full bg-purple-100 text-purple-700">{automation.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {previewCard}
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 backdrop-blur">
                <p className="text-sm font-semibold text-slate-700">Next automation touchpoint</p>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-purple-600/70">{previewSummary.schedule}</p>
                <p className="mt-3 text-sm text-slate-600">{previewSummary.tracking}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          {builderCard}
          <div className="flex flex-col gap-4">
            <Card className="h-full border border-purple-200/70 bg-gradient-to-b from-white via-purple-50 to-white/40">
              <CardHeader className="gap-2">
                <CardTitle className="text-xl text-purple-900">Campaign timeline</CardTitle>
                <CardDescription className="text-purple-700/80">
                  Track the flow of key sends across the last quarter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                        {index + 1}
                      </div>
                      {index !== recentCampaigns.length - 1 ? (
                        <div className="h-full w-px bg-purple-200" aria-hidden />
                      ) : null}
                    </div>
                    <div className="rounded-2xl border border-purple-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                      <p className="text-sm font-semibold text-purple-900">{campaign.name}</p>
                      <p className="text-xs text-purple-700/80">{campaign.type} · {campaign.audience}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-purple-600/80">
                        <span>{campaign.sentOn}</span>
                        <span>Opens {campaign.opens}</span>
                        <span>Clicks {campaign.clicks}</span>
                        <Badge className="rounded-full bg-purple-100 text-purple-700">{campaign.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  if (visualVariant === "split") {
    return (
      <div className="grid gap-8 xl:grid-cols-[minmax(340px,380px)_1fr]">
        <div className="space-y-6">
          {builderCard}
          {previewCard}
        </div>
        <div className="grid gap-6">
          <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Engagement health</p>
                <h2 className="mt-2 text-3xl font-semibold">Core KPIs</h2>
              </div>
              <Button variant="outline" className="border-slate-500/60 bg-transparent text-slate-100 hover:bg-slate-800">
                Download report
              </Button>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {performanceCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-300">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                  <p className="text-sm text-slate-300">{card.helper}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Campaign ledger</CardTitle>
                  <CardDescription>Snapshot of the last four sends.</CardDescription>
                </div>
                <Button variant="ghost" className="rounded-full px-4">
                  View all
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="grid gap-2 rounded-2xl border border-border/60 bg-background/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                      <Badge variant={campaign.status === "Sent" ? "accent" : "outline"}>{campaign.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{campaign.type} · {campaign.audience}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>{campaign.sentOn}</span>
                      <span>Opens {campaign.opens}</span>
                      <span>Clicks {campaign.clicks}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="border-border/60 bg-background/80">
                <CardHeader className="gap-2">
                  <CardTitle className="text-lg">Automation spotlight</CardTitle>
                  <CardDescription>Watch which journeys are delivering.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {automations.map((automation) => (
                    <div key={automation.id} className="rounded-2xl border border-border/50 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{automation.name}</p>
                        <Badge variant={automation.status === "Active" ? "accent" : "outline"}>{automation.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{automation.trigger}</p>
                      <p className="mt-2 text-sm text-foreground">{automation.action}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{automation.metric}</p>
                      <p className="text-xs text-muted-foreground">{automation.lastTouched}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/80">
                <CardHeader className="gap-2">
                  <CardTitle className="text-lg">Send readiness</CardTitle>
                  <CardDescription>Ensure every blast is launch-ready.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Deliverability health</span>
                    <span className="font-semibold text-foreground">Green</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Compliance review</span>
                    <span className="font-semibold text-foreground">Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next optimal window</span>
                    <span className="font-semibold text-foreground">Tomorrow · 9:00am PT</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        {builderCard}
        <div className="space-y-6">
          {previewCard}
          <div className="rounded-3xl border border-dashed border-border/60 bg-background/50 p-6">
            <p className="text-sm font-semibold text-foreground">Engagement scorecards</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {performanceCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        <Card className="border-dashed border-border/60 bg-background">
          <CardHeader>
            <CardTitle className="text-xl">Recent campaigns</CardTitle>
            <CardDescription>A lightweight digest of what shipped recently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full border border-border/60 text-center text-sm font-semibold leading-10 text-muted-foreground">
                  {campaign.type[0]}
                </div>
                <div className="flex-1 border-b border-dashed border-border/50 pb-4 last:border-none">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                    <span className="text-xs text-muted-foreground">{campaign.sentOn}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{campaign.audience}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Opens {campaign.opens}</span>
                    <span>Clicks {campaign.clicks}</span>
                    <Badge variant={campaign.status === "Sent" ? "accent" : "outline"}>{campaign.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/60 bg-background/70">
          <CardHeader>
            <CardTitle className="text-xl">Automation checklist</CardTitle>
            <CardDescription>Quick look at every journey status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {automations.map((automation) => (
              <div key={automation.id} className="rounded-2xl border border-border/60 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{automation.name}</p>
                  <Badge variant={automation.status === "Active" ? "accent" : "outline"}>{automation.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{automation.trigger}</p>
                <p className="mt-1 text-xs text-muted-foreground">{automation.action}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{automation.metric}</span>
                  <span>{automation.lastTouched}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
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
