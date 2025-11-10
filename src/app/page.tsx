import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";

export const revalidate = 0;

const pillars = [
  {
    title: "Curation first",
    description:
      "Every member is hand-reviewed by the founders. We look for warm energy, curiosity, and a track record of showing up for others.",
  },
  {
    title: "IRL beats the feed",
    description:
      "From salons and chef's tables to gallery takeovers, our events are designed for real chemistry—not endless swiping.",
  },
  {
    title: "Privacy obsessed",
    description:
      "No public directory. No surprise photo walls. You choose what to share and who to share it with.",
  },
];

const highlights = [
  "Thoughtfully mixed guest lists capped at 48",
  "Signature conversation menus to melt the ice",
  "Dedicated hosts who remember your preferences",
  "Members-only RSVP drops & event waitlists",
];

const membershipSteps = [
  {
    title: "Apply",
    description:
      "Tell us about yourself, your vibe, and the energy you bring into a room.",
  },
  {
    title: "Interview",
    description:
      "We meet 1:1—virtually or over a martini—to understand your story and what you seek.",
  },
  {
    title: "Party",
    description:
      "Choose your first salon, RSVP with one tap, and let the hosts take care of the rest.",
  },
];

const DEFAULT_EVENT_GALLERY = [
  {
    src: "/images/event-gallery/date-night-toast.svg",
    alt: "Graphic treatment of a date night toast in twilight tones.",
  },
  {
    src: "/images/event-gallery/speakeasy-lounge.svg",
    alt: "Graphic treatment of a speakeasy lounge scene in gold light.",
  },
  {
    src: "/images/event-gallery/rooftop-soiree.svg",
    alt: "Graphic treatment of a rooftop soirée in teal night hues.",
  },
  {
    src: "/images/event-gallery/supper-club.svg",
    alt: "Graphic treatment of a supper club moment in warm gradients.",
  },
  {
    src: "https://images.unsplash.com/photo-1529634898388-84d0fb4fb9b8?auto=format&fit=crop&w=1024&q=80",
    alt: "Couple clinking cocktails at a candlelit bar table.",
  },
  {
    src: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1024&q=80",
    alt: "Friends laughing together in a vibrant lounge.",
  },
  {
    src: "https://images.unsplash.com/photo-1544075571-21005b86c60c?auto=format&fit=crop&w=1024&q=80",
    alt: "Couple sharing a toast in a dimly lit speakeasy.",
  },
  {
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1024&q=80",
    alt: "Elegant pair posing beside the bar lights.",
  },
  {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1024&q=80",
    alt: "Group of friends sharing dinner and wine.",
  },
  {
    src: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1024&q=80",
    alt: "Couple enjoying cocktails at a rooftop party.",
  },
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1024&q=80",
    alt: "Stylish guests mingling in a neon bar.",
  },
  {
    src: "https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=1024&q=80",
    alt: "Smiling couple leaning in over candlelight.",
  },
  {
    src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1024&q=80",
    alt: "Couple sharing a laugh at a cocktail bar.",
  },
  {
    src: "https://images.unsplash.com/photo-1519677125930-b67ecfb37c51?auto=format&fit=crop&w=1024&q=80",
    alt: "Friends celebrating with champagne at night.",
  },
  {
    src: "https://images.unsplash.com/photo-1545912452-74fdc76b8413?auto=format&fit=crop&w=1024&q=80",
    alt: "Couple leaning close during a live jazz set.",
  },
  {
    src: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1024&q=80",
    alt: "Pair laughing together at a cocktail table.",
  },
  {
    src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1024&q=80",
    alt: "Stylish duo toasting at a glowing bar.",
  },
  {
    src: "https://images.unsplash.com/photo-1510821469-5a1c981f82c7?auto=format&fit=crop&w=1024&q=80",
    alt: "Couple smiling during a dinner date.",
  },
  {
    src: "https://images.unsplash.com/photo-1517164850305-96c3a05fe590?auto=format&fit=crop&w=1024&q=80",
    alt: "Friends dressed up for a night out in the city.",
  },
];

export default async function HomePage() {
  const carouselRecords = await prisma.homepageCarouselImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const carouselImages = carouselRecords.length
    ? carouselRecords.map((image) => ({
        src: image.imageUrl,
        alt: image.altText ?? "Members enjoying a HENRYS gathering.",
      }))
    : DEFAULT_EVENT_GALLERY;

  const marqueeImages = [...carouselImages, ...carouselImages];

  return (
    <div className="px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="space-y-12 md:hidden">
        <section className="space-y-6 rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Invite-only · London
          </span>
          <div className="space-y-4 text-left">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
              {SITE_COPY.tagLine}
            </h1>
            <p className="text-base text-muted-foreground">{SITE_COPY.description}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/apply" className="flex items-center justify-center gap-2">
                Apply to join <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/faq">Browse the FAQ</Link>
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card/80">
          <div className="relative">
            <div className="flex w-max animate-marquee gap-4 p-4" aria-hidden={true}>
              {marqueeImages.map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className="h-40 w-48 overflow-hidden rounded-2xl border border-border/60 bg-background/70"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={320}
                    height={256}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background via-card/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background via-card/80 to-transparent" />
          </div>
          <p className="px-6 pb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Moments from recent salons and after-hours adventures
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Why members join</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-foreground" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Club pillars</h2>
          <div className="space-y-4">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground/90">
                    {pillar.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">How membership works</h2>
            <p className="text-sm text-muted-foreground">
              Apply once. Interview with the founders. If you&apos;re a fit, you&apos;ll receive a magic link invite to finish onboarding
              and unlock the members lounge.
            </p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {membershipSteps.map((step, index) => (
              <Card
                key={step.title}
                className="min-w-[16rem] flex-1 border-border/70 bg-card/90 shadow-sm"
              >
                <CardHeader>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{step.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[28px] border border-border/70 bg-card/80 p-6 text-center">
          <h3 className="text-xl font-semibold">Ready to trade swipes for salons?</h3>
          <p className="text-sm text-muted-foreground">
            Membership is capped each season to keep the chemistry high. We review applications weekly.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/apply" className="flex items-center justify-center gap-2">
                Start application <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/about" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Learn more about the club →
            </Link>
          </div>
        </section>
      </div>

      <div className="hidden flex-col md:flex">
        <section className="mx-auto flex max-w-5xl flex-col items-start gap-10 rounded-[40px] border border-border/60 bg-card/70 p-8 shadow-xl backdrop-blur-sm sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Invite-only · London
          </span>
          <div className="space-y-6 text-left">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              {SITE_COPY.tagLine}
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">{SITE_COPY.description}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/apply" className="flex items-center gap-2">
                Apply to join <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/faq">Browse the FAQ</Link>
            </Button>
          </div>
          <ul className="grid w-full gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-2xl border border-border/50 bg-background/60 p-4">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-foreground" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-12 w-full max-w-5xl overflow-hidden rounded-[36px] border border-border/70 bg-card/80">
          <div className="relative">
            <div className="flex w-max animate-marquee gap-6 p-6" aria-hidden={true}>
              {marqueeImages.map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className="h-52 w-64 overflow-hidden rounded-3xl border border-border/60 bg-background/70"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={512}
                    height={416}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-card/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-card/80 to-transparent" />
          </div>
          <p className="px-10 pb-8 text-center text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Glimpses from members-only dinners, speakeasies & after-parties
          </p>
        </section>

        <section className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="h-full border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground/90">
                  {pillar.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mx-auto mt-20 max-w-4xl space-y-6 rounded-[36px] border border-border/70 bg-gradient-to-br from-background via-background to-muted/40 p-8 sm:p-12">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">How membership works</h2>
            <p className="text-muted-foreground">
              Apply once. Interview with the founders. If you&apos;re a fit, you&apos;ll receive a magic link invite to finish onboarding
              and unlock the members lounge.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {membershipSteps.map((step, index) => (
              <Card key={step.title} className="border-border/60 bg-card/90">
                <CardHeader>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Step {index + 1}</span>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{step.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-5xl rounded-[32px] border border-border/70 bg-card/80 p-8 text-center sm:p-12">
          <h3 className="text-2xl font-semibold sm:text-3xl">Ready to trade swipes for salons?</h3>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Membership is capped each season to keep the chemistry high. We review applications weekly.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/apply" className="flex items-center gap-2">
                Start application <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/about" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Learn more about the club →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
