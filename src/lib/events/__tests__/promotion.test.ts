import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { promoteNextWaitlistedRsvp, type PromotionDependencies } from "../promotion";
import { RsvpStatus } from "@/lib/prisma-constants";

type Rsvp = {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  promotionHoldUntil: Date | null;
  promotionLockId: string | null;
};

type User = { id: string; email: string; name?: string | null };

type Subscription = { userId: string; stripeCustomerId: string };

type MockDeps = {
  event: { id: string; name: string; priceCents: number; currency: string; summary?: string | null; startAt: Date };
  rsvps: Rsvp[];
  users: Record<string, User>;
  subscriptions?: Subscription[];
  stripeBehavior?: {
    paymentIntentStatus?: string;
    paymentMethodId?: string | null;
    paymentIntentError?: Error;
    checkoutError?: Error;
  };
  now?: Date;
};

function createDeps({ event, rsvps, users, subscriptions = [], stripeBehavior = {}, now }: MockDeps) {
  const stripe = {
    paymentMethods: {
      list: vi.fn(async () => ({
        data: stripeBehavior.paymentMethodId ? [{ id: stripeBehavior.paymentMethodId }] : [],
      })),
    },
    paymentIntents: {
      create: vi.fn(async () => {
        if (stripeBehavior.paymentIntentError) {
          throw stripeBehavior.paymentIntentError;
        }
        return { status: stripeBehavior.paymentIntentStatus ?? "succeeded" };
      }),
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => {
          if (stripeBehavior.checkoutError) {
            throw stripeBehavior.checkoutError;
          }
          return { id: "cs_test", url: "https://stripe.test/checkout" };
        }),
      },
    },
  };

  const prisma = {
    event: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === event.id ? event : null)),
    },
    eventRsvp: {
      findMany: vi.fn(async ({ where }: { where?: Partial<Rsvp> } = {}) =>
        rsvps
          .filter((rsvp) => {
            if (where?.eventId && rsvp.eventId !== where.eventId) return false;
            if (where?.status && rsvp.status !== where.status) return false;
            return true;
          })
          .map((rsvp) => ({ ...rsvp })),
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Rsvp> }) => {
        const target = rsvps.find((entry) => entry.id === where.id);
        if (!target) throw new Error("RSVP not found");
        Object.assign(target, data, { updatedAt: new Date() });
        return { ...target };
      }),
      updateMany: vi.fn(
        async ({ where, data }: { where?: Partial<Rsvp>; data: Partial<Rsvp> }) => {
          let count = 0;
          for (const entry of rsvps) {
            if (where?.id && entry.id !== where.id) continue;
            if (where?.status && entry.status !== where.status) continue;
            if (where?.promotionHoldUntil !== undefined && entry.promotionHoldUntil !== where.promotionHoldUntil)
              continue;
            if (where?.promotionLockId !== undefined && entry.promotionLockId !== where.promotionLockId) continue;
            Object.assign(entry, data, { updatedAt: new Date() });
            count += 1;
          }
          return { count };
        },
      ),
    },
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => users[where.id] ?? null),
    },
    subscription: {
      findFirst: vi.fn(async ({ where }: { where: { userId: string } }) =>
        subscriptions.find((sub) => sub.userId === where.userId) ?? null,
      ),
    },
  };

  const sendEmail = vi.fn(async () => {});
  const getBaseUrl = () => "https://henrys.test";

  const deps = { prisma, stripe, sendEmail, getBaseUrl, ...(now ? { now: () => now } : {}) };
  return deps as PromotionDependencies & typeof deps;
}

describe("promoteNextWaitlistedRsvp", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseEvent = {
    id: "event",
    name: "Salon",
    priceCents: 0,
    currency: "usd",
    summary: "",
    startAt: new Date("2024-08-01T20:00:00.000Z"),
  };

  const baseRsvp: Rsvp = {
    id: "rsvp1",
    userId: "user1",
    eventId: "event",
    status: RsvpStatus.WAITLISTED,
    createdAt: new Date("2024-07-01T10:00:00.000Z"),
    updatedAt: new Date("2024-07-01T10:00:00.000Z"),
    promotionHoldUntil: null,
    promotionLockId: null,
  };

  it("promotes the earliest waitlisted attendee for free events", async () => {
    const deps = createDeps({
      event: baseEvent,
      rsvps: [{ ...baseRsvp }],
      users: { user1: { id: "user1", email: "waitlist@example.com", name: "Wait Lister" } },
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result.status).toBe("promoted");
    expect(deps.prisma.eventRsvp.update).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    await expect(deps.prisma.eventRsvp.findMany()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: RsvpStatus.GOING }),
      ]),
    );
  });

  it("charges saved payment method for paid events", async () => {
    const deps = createDeps({
      event: { ...baseEvent, priceCents: 4500 },
      rsvps: [{ ...baseRsvp }],
      users: { user1: { id: "user1", email: "waitlist@example.com" } },
      subscriptions: [{ userId: "user1", stripeCustomerId: "cus_123" }],
      stripeBehavior: { paymentMethodId: "pm_123", paymentIntentStatus: "succeeded" },
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result.status).toBe("promoted");
    expect(deps.stripe.paymentIntents.create).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    const updated = await deps.prisma.eventRsvp.findMany();
    expect(updated[0]?.status).toBe(RsvpStatus.GOING);
  });

  it("sends checkout session when no payment method is available", async () => {
    const deps = createDeps({
      event: { ...baseEvent, priceCents: 4500 },
      rsvps: [{ ...baseRsvp }],
      users: { user1: { id: "user1", email: "waitlist@example.com" } },
      subscriptions: [{ userId: "user1", stripeCustomerId: "cus_123" }],
      stripeBehavior: { paymentMethodId: null },
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result.status).toBe("checkout_link_sent");
    expect(deps.stripe.checkout.sessions.create).toHaveBeenCalled();
    expect(deps.sendEmail).toHaveBeenCalled();
    const updated = await deps.prisma.eventRsvp.findMany();
    expect(updated[0]?.promotionHoldUntil).not.toBeNull();
  });

  it("returns event_not_found when the event is missing", async () => {
    const deps = createDeps({
      event: { ...baseEvent, id: "other" },
      rsvps: [],
      users: {},
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result).toEqual({ status: "event_not_found" });
  });

  it("skips entries without a reachable user and promotes the next attendee", async () => {
    const deps = createDeps({
      event: { ...baseEvent, priceCents: 0 },
      rsvps: [
        { ...baseRsvp, id: "rsvp1" },
        { ...baseRsvp, id: "rsvp2", userId: "user2", createdAt: new Date("2024-07-01T11:00:00.000Z") },
      ],
      users: {
        user1: { id: "user1", email: "" },
        user2: { id: "user2", email: "waitlist@example.com" },
      },
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result).toEqual({ status: "promoted", userId: "user2", rsvpId: "rsvp2" });
    const rsvps = await deps.prisma.eventRsvp.findMany();
    expect(rsvps.find((entry) => entry.id === "rsvp1")?.promotionHoldUntil).toBeNull();
    expect(rsvps.find((entry) => entry.id === "rsvp2")?.status).toBe(RsvpStatus.GOING);
  });

  it("continues through the queue when checkout creation fails", async () => {
    const deps = createDeps({
      event: { ...baseEvent, priceCents: 4500 },
      rsvps: [
        { ...baseRsvp, id: "rsvp1" },
        { ...baseRsvp, id: "rsvp2", userId: "user2", createdAt: new Date("2024-07-01T11:00:00.000Z") },
      ],
      users: {
        user1: { id: "user1", email: "waitlist1@example.com" },
        user2: { id: "user2", email: "waitlist2@example.com" },
      },
      stripeBehavior: { paymentMethodId: null },
    });

    deps.stripe.checkout.sessions.create.mockImplementationOnce(async () => {
      throw new Error("fail");
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result).toEqual({ status: "checkout_link_sent", userId: "user2", rsvpId: "rsvp2", expiresAt: expect.any(Date) });
    expect(deps.stripe.checkout.sessions.create).toHaveBeenCalledTimes(2);
  });

  it("returns the last skip reason when every waitlisted attendee fails", async () => {
    const deps = createDeps({
      event: { ...baseEvent, priceCents: 4500 },
      rsvps: [
        { ...baseRsvp, id: "rsvp1" },
        { ...baseRsvp, id: "rsvp2", userId: "user2", createdAt: new Date("2024-07-01T11:00:00.000Z") },
      ],
      users: {
        user1: { id: "user1", email: "waitlist1@example.com" },
        user2: { id: "user2", email: "waitlist2@example.com" },
      },
      stripeBehavior: { checkoutError: new Error("fail"), paymentMethodId: null },
    });

    // Force both attempts to fail by making checkout throw and clearing hold afterwards
    deps.stripe.checkout.sessions.create.mockImplementation(async () => {
      throw new Error("fail");
    });

    const result = await promoteNextWaitlistedRsvp("event", deps);
    expect(result).toEqual({ status: "skipped", reason: "checkout_failed" });
    const rsvps = await deps.prisma.eventRsvp.findMany();
    expect(rsvps.every((entry) => entry.promotionHoldUntil === null)).toBe(true);
  });
});
