import type { Metadata } from "next";
import { SITE_COPY } from "@/lib/site-copy";
import { EmailStudioDashboard } from "./email-studio-dashboard";
import type { EmailStudioDashboardProps } from "./email-studio-dashboard";

export const metadata: Metadata = {
  title: `Email studio · ${SITE_COPY.name}`,
  description: "Plan, compose, and automate branded emails for the community.",
};

const performanceCards: EmailStudioDashboardProps["performanceCards"] = [
  {
    label: "Emails sent (30d)",
    value: "4,820",
    helper: "+8.4% vs prior period",
  },
  {
    label: "Avg. open rate",
    value: "68%",
    helper: "Consistent with last cohort",
  },
  {
    label: "Avg. click rate",
    value: "24%",
    helper: "+5 pts on event invites",
  },
  {
    label: "Unsubscribe rate",
    value: "0.9%",
    helper: "Healthy — below 1.5% goal",
  },
];

const recentCampaigns: EmailStudioDashboardProps["recentCampaigns"] = [
  {
    id: "community-dinner",
    name: "Community dinner RSVP",
    type: "One-off",
    audience: "Active members",
    sentOn: "Apr 12, 2024",
    opens: "72%",
    clicks: "31%",
    status: "Sent",
  },
  {
    id: "april-digest",
    name: "April community digest",
    type: "Recurring",
    audience: "Members & alumni",
    sentOn: "Apr 1, 2024",
    opens: "67%",
    clicks: "24%",
    status: "Sent",
  },
  {
    id: "event-reminder",
    name: "Event reminder: Demo Day",
    type: "Conditional",
    audience: "RSVP’d members",
    sentOn: "Mar 28, 2024",
    opens: "81%",
    clicks: "38%",
    status: "Automation",
  },
  {
    id: "renewal",
    name: "Membership renewal 30 day",
    type: "Recurring",
    audience: "Renewals cohort",
    sentOn: "Mar 15, 2024",
    opens: "64%",
    clicks: "19%",
    status: "Sent",
  },
];

const automations: EmailStudioDashboardProps["automations"] = [
  {
    id: "new-member-onboarding",
    name: "New member onboarding",
    trigger: "When membership is approved",
    action: "Send 3-part welcome series",
    metric: "Avg open 83%",
    status: "Active",
    lastTouched: "Updated 6 days ago",
  },
  {
    id: "event-follow-up",
    name: "Event follow-up",
    trigger: "24 hours after attending an event",
    action: "Send recap + feedback form",
    metric: "Click rate 29%",
    status: "Active",
    lastTouched: "Running weekly",
  },
  {
    id: "application-nudge",
    name: "Application nudge",
    trigger: "If application is idle for 7 days",
    action: "Send reminder to finish submission",
    metric: "Conversion lift +12%",
    status: "Paused",
    lastTouched: "Paused last week",
  },
];

export default async function EmailStudioPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Email studio</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Design broadcasts, cadences, and automations</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Explore four dashboard concepts for one-off announcements, recurring touchpoints, and condition-based journeys — the
          prototypes are unlocked so the team can experiment without signing in.
        </p>
      </header>

      <EmailStudioDashboard
        performanceCards={performanceCards}
        recentCampaigns={recentCampaigns}
        automations={automations}
      />
    </div>
  );
}
