import type { Metadata } from "next";
import {
  CalendarDays,
  Handshake,
  LockKeyhole,
  Sparkles,
  Users2,
} from "lucide-react";

import { SITE_COPY } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "FAQ · HENRYS",
  description:
    "Answers to the most common questions about HENRYS, the invite-only IRL social club.",
};

const highlights = [
  {
    title: "Curated membership",
    description:
      "25–38 year olds who bring texture, curiosity, and generosity to every gathering—never a random grab bag.",
  },
  {
    title: "Human-led matchmaking",
    description:
      "Our founders personally review every match, using tech only where it keeps things thoughtful and friction-free.",
  },
  {
    title: "Hospitality-first hosting",
    description:
      "Trained hosts, rich run-of-shows, and a concierge mindset so you can just arrive and be present.",
  },
];

const faqSections = [
  {
    title: "Membership basics",
    icon: Users2,
    items: [
      {
        question: "Who is HENRYS for?",
        answer:
          "HENRYS is for wildly interesting people aged 25–38 who are over the scroll and craving intentional IRL experiences. We curate a balanced membership across industries, backgrounds, and energies to keep every table dynamic.",
      },
      {
        question: "How do applications work?",
        answer:
          "Apply once. The founders review every response. If we sense a fit, we'll invite you to a five-minute Zoom interview to align on vibe and expectations. Pass the initial application and you'll have that interview no later than a week afterward. Approved members receive a one-click invite to finish onboarding—no endless waitlists.",
      },
      {
        question: "How much does membership cost?",
        answer:
          "Annual membership and event pricing varies by season. Expect a monthly membership option plus à-la-carte event tickets. Scholarships are available for some students—just mention it in your application.",
      },
    ],
  },
  {
    title: "Experiences & logistics",
    icon: CalendarDays,
    items: [
      {
        question: "What kinds of events can I expect?",
        answer:
          "Think chef's tables, speakeasy takeovers, gallery nights, countryside escapes, and slow-sipping cocktail hours. We design for depth over volume and cap most gatherings at 24 guests so the conversation stays electric.",
      },
      {
        question: "Can I bring a plus one?",
        answer:
          "Members can request a plus-one for select gatherings. Guests complete an expedited application and, once approved, purchase their own ticket. Invites, digital tickets, and check-in happen through your dashboard and the host tools.",
      },
      {
        question: "What if I need to cancel?",
        answer:
          "Life happens. Members can cancel RSVPs directly from the dashboard up to 24 hours before an event with no penalty. No-shows receive a strike, and collecting too many strikes means sitting out future events for a spell.",
      },
    ],
  },
  {
    title: "Trust & care",
    icon: LockKeyhole,
    items: [
      {
        question: "Do you use algorithms to match members?",
        answer:
          "We do not use any algorithms to match members. Every seating chart and introduction is crafted by hand by the founding team.",
      },
      {
        question: "Is my data safe?",
        answer:
          "Yes. We only collect what's needed to seat you well: preferences, vibe, and availability. Everything lives in an encrypted database. We never sell or share your data, and you can request deletion anytime.",
      },
      {
        question: "Are hosts trained?",
        answer:
          "Yes. Hosts access run-of-show docs, real-time rosters, and QR check-in tools in the host portal. We invest in hospitality training and have a rotating bench of alumni hosts for larger events.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-16">
      <section className="relative isolate overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950 px-6 py-16 text-white shadow-[0_40px_120px_-40px_rgba(56,72,255,0.55)] sm:px-12">
        <div className="absolute inset-x-0 top-0 -z-10 flex justify-center">
          <div className="h-32 w-3/4 rounded-full bg-gradient-to-r from-indigo-500/60 via-fuchsia-400/40 to-sky-400/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            <Sparkles className="h-4 w-4" aria-hidden />
            FAQ
          </span>
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Everything you&apos;re curious about {SITE_COPY.name}
          </h1>
          <p className="text-pretty text-base text-white/80 sm:text-lg">
            From membership flow to event cadence, we&apos;ve gathered the essentials so you know exactly how our invite-only IRL social club runs behind the scenes.
          </p>
        </div>

        <dl className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <dt className="text-sm font-semibold uppercase tracking-wide text-white/70">{item.title}</dt>
              <dd className="mt-2 text-sm text-white/90">{item.description}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 flex items-center justify-center gap-3 text-sm text-white/70">
          Expect intimate dinners, roundtable conversations, and magic-hour city adventures.
        </p>
      </section>

      <section className="mx-auto max-w-5xl space-y-16">
        {faqSections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.title}
              className="rounded-3xl border border-slate-200/70 bg-white/60 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/60"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{section.title}</h2>
                </div>
                <Handshake className="hidden h-7 w-7 text-slate-400 dark:text-slate-500 sm:block" aria-hidden />
              </div>
              <dl className="mt-8 space-y-8">
                {section.items.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/70"
                  >
                    <dt className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.question}</dt>
                    <dd className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-3xl rounded-3xl border border-indigo-200/50 bg-indigo-50/60 p-10 text-center dark:border-indigo-400/40 dark:bg-indigo-500/10">
        <h2 className="text-2xl font-semibold text-indigo-900 dark:text-indigo-200">Still have a question?</h2>
        <p className="mt-3 text-base text-indigo-900/80 dark:text-indigo-200/80">
          Email <a className="font-semibold underline decoration-indigo-400/80 decoration-2 underline-offset-4" href="mailto:founders@henrys.club">founders@henrys.club</a> and the team will get back to you faster than you can say “see you soon.”
        </p>
      </section>
    </div>
  );
}
