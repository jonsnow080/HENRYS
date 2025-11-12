"use client";

import { useMemo, useState } from "react";
import { BarChart3, Sparkles, TrendingUp } from "lucide-react";
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

  function updateFormField(field: string, value: string | boolean) {
    setForms((previous) => {
      const next = { ...previous };
      const current = { ...next[selectedType] } as Record<string, string | boolean>;
      current[field] = value;
      next[selectedType] = current as EmailFormState[EmailType];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <PerformanceHighlights cards={performanceCards} />
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <EmailPreviewCard selectedType={selectedType} currentForm={currentForm} previewSummary={previewSummary} />
        <EmailBuilderCard
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          currentForm={currentForm}
          updateFormField={updateFormField}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
        <RecentPerformanceCard campaigns={recentCampaigns} />
        <JourneyHeatmapCard />
      </div>
      <AutomationsCard automations={automations} />
    </div>
  );
}

type EmailBuilderCardProps = {
  selectedType: EmailType;
  setSelectedType: (type: EmailType) => void;
  currentForm: EmailFormState[EmailType];
  updateFormField: (field: string, value: string | boolean) => void;
};

function EmailBuilderCard({ selectedType, setSelectedType, currentForm, updateFormField }: EmailBuilderCardProps) {
  return (
    <Card className="overflow-hidden border-transparent bg-white/80 shadow-xl shadow-sky-200/40 backdrop-blur">
      <CardHeader className="gap-4 border-b border-border/60 pb-6">
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
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">Call-to-action label</Label>
            <Input
              id="ctaLabel"
              value={currentForm.ctaLabel}
              onChange={(event) => updateFormField("ctaLabel", event.target.value)}
              placeholder="Button copy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">Call-to-action link</Label>
            <Input
              id="ctaUrl"
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
}

type EmailPreviewCardProps = {
  selectedType: EmailType;
  currentForm: EmailFormState[EmailType];
  previewSummary: PreviewSummary;
};

function EmailPreviewCard({ selectedType, currentForm, previewSummary }: EmailPreviewCardProps) {
  return (
    <Card className="border border-transparent bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-xl shadow-sky-200/40">
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
        <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-inner backdrop-blur">
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
        <div className="grid gap-3 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <TrendingUp className="h-4 w-4" />
            Delivery plan
          </div>
          <div className="space-y-1 text-muted-foreground">
            <p>{previewSummary.schedule}</p>
            <p>{previewSummary.tracking}</p>
            <p>{previewSummary.cta}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type RecentPerformanceCardProps = {
  campaigns: CampaignRow[];
};

function RecentPerformanceCard({ campaigns }: RecentPerformanceCardProps) {
  return (
    <Card className="overflow-hidden border border-transparent bg-white/80 shadow-lg shadow-sky-200/40 backdrop-blur">
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
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="text-sm">
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

type AutomationsCardProps = {
  automations: AutomationRow[];
};

function AutomationsCard({ automations }: AutomationsCardProps) {
  return (
    <Card className="border border-transparent bg-white/80 shadow-lg shadow-sky-200/40 backdrop-blur">
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
  );
}

type PerformanceHighlightsProps = {
  cards: PerformanceCard[];
};

function PerformanceHighlights({ cards }: PerformanceHighlightsProps) {
  return (
    <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-8 shadow-lg shadow-sky-200/40">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-900/70">Pulse overview</p>
          <h2 className="text-3xl font-semibold text-slate-900">Momentum looks strong</h2>
          <p className="max-w-xl text-sm text-slate-700">
            Keep nudging the community along by blending one-off hype moments, consistent digests, and automated nudges.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-white/70 px-5 py-3 text-sm font-medium text-slate-700 shadow-inner">
          <Sparkles className="h-4 w-4 text-sky-500" />
          Smart recommendations available
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <div key={card.label} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.helper}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              Trend {index % 2 === 0 ? "up" : "steady"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JourneyHeatmapCard() {
  const heatmap = [
    { label: "Welcome", values: [92, 88, 85, 81] },
    { label: "Event RSVP", values: [74, 79, 83, 85] },
    { label: "Follow-up", values: [61, 68, 70, 72] },
    { label: "Renewal", values: [55, 57, 59, 60] },
  ];

  return (
    <Card className="border border-transparent bg-white/80 shadow-lg shadow-sky-200/40 backdrop-blur">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-sky-500" /> Journey heatmap
        </CardTitle>
        <CardDescription>See where automations are thriving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {heatmap.map((row) => (
          <div key={row.label} className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{row.label}</p>
            <div className="flex gap-2">
              {row.values.map((value, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl bg-sky-500/10 text-xs font-semibold text-sky-600"
                  style={{ opacity: 0.6 + index * 0.1 }}
                >
                  {value}%
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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
