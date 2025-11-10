import { ApplicationStatus, Role } from "@/lib/prisma-constants";

type ApplicationPayload = Record<string, unknown>;

type StringFilter =
  | string
  | {
      contains?: string;
      mode?: "insensitive" | "default";
    };

type IdFilter = string | { in?: string[] };

type StatusFilter = ApplicationStatus | { in?: ApplicationStatus[] };

type ApplicationWhere = {
  id?: IdFilter;
  email?: StringFilter;
  fullName?: StringFilter;
  notes?: StringFilter;
  status?: StatusFilter;
  OR?: ApplicationWhere[];
};

type OrderRule = Record<string, "asc" | "desc">;

type OrderBy = OrderRule | OrderRule[] | undefined;

type ReviewerSelection = {
  select?: {
    name?: boolean;
    email?: boolean;
  };
};

type ApplicationInclude = {
  reviewer?: ReviewerSelection;
};

type ApplicationArgs = {
  where?: ApplicationWhere;
  orderBy?: OrderBy;
  include?: ApplicationInclude;
};

type ApplicationCreateArgs = {
  data: {
    email: string;
    fullName: string;
    payload?: ApplicationPayload;
    status?: ApplicationStatus;
    notes?: string | null;
  };
  include?: ApplicationInclude;
};

type ApplicationUpdateArgs = {
  where: { id: string };
  data: Partial<{
    email: string;
    fullName: string;
    payload: ApplicationPayload;
    status: ApplicationStatus;
    notes: string | null;
    reviewedAt: Date | null;
    reviewerId: string | null;
    applicantId: string | null;
    createdAt: Date;
  }>;
  include?: ApplicationInclude;
};

type UserWhere = {
  id?: IdFilter;
  email?: string | { in?: string[] };
  role?: Role | { in?: Role[] };
};

type UserCreateArgs = {
  data: {
    email: string;
    name?: string | null;
    role?: Role;
    passwordHash?: string | null;
  };
};

type UserUpdateArgs = {
  where: UserWhere;
  data: {
    email?: string;
    name?: string | null;
    role?: Role;
    passwordHash?: string | null;
  };
};

type SessionCreateArgs = {
  data: {
    sessionToken: string;
    userId: string;
    expires: Date;
  };
};

type SessionUpdateArgs = {
  where: { sessionToken: string };
  data: Partial<{
    sessionToken: string;
    userId: string;
    expires: Date;
  }>;
};

type SessionDeleteArgs = {
  where: { sessionToken: string };
};

type SessionFindUniqueArgs = {
  where: { sessionToken: string };
  include?: { user?: boolean };
};

type SessionDeleteManyArgs = {
  where?: { user?: { email?: string } };
};

type VerificationTokenCreateArgs = {
  data: {
    identifier: string;
    token: string;
    expires: Date;
  };
};

type VerificationTokenDeleteArgs = {
  where: { identifier_token: { identifier: string; token: string } };
};

type InviteCodeCreateArgs = {
  data: {
    code: string;
    applicationId: string;
    userId: string;
    expiresAt: Date;
  };
};

type MemberProfileUpsertArgs = {
  where: { userId: string };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

type AccountCreateArgs = {
  data: {
    provider: string;
    providerAccountId: string;
    type?: string;
    userId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
    oauth_token_secret?: string | null;
    oauth_token?: string | null;
  };
};

type AccountDeleteArgs = {
  where: { provider_providerAccountId: string };
};

type AccountFindUniqueArgs = {
  where: { provider_providerAccountId: string };
  include?: { user?: boolean };
};

type AccountFindFirstArgs = {
  where: { providerAccountId?: string; provider?: string };
};

type AuthenticatorCreateArgs = {
  data: {
    id?: string;
    credentialID: string;
    userId: string;
    providerAccountId?: string | null;
    credentialPublicKey?: Buffer | Uint8Array | null;
    counter?: number;
    credentialDeviceType?: string | null;
    credentialBackedUp?: boolean;
    transports?: string | null;
  };
};

type AuthenticatorUpdateArgs = {
  where: { credentialID: string };
  data: Partial<{ counter: number }>;
};

type AuthenticatorFindManyArgs = {
  where: { userId: string };
};

type ApplicationStub = {
  id: string;
  email: string;
  fullName: string;
  status: ApplicationStatus;
  payload: ApplicationPayload;
  notes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewerId: string | null;
  applicantId: string | null;
};

type UserStub = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  passwordHash: string | null;
};

type MemberProfileStub = {
  id: string;
  userId: string;
  data: Record<string, unknown>;
};

type InviteCodeStub = {
  id: string;
  code: string;
  applicationId: string;
  userId: string;
  expiresAt: Date;
};

type SessionStub = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
};

type VerificationTokenStub = {
  identifier: string;
  token: string;
  expires: Date;
};

type MembershipPlanStub = {
  id: string;
  name: string;
  stripePriceId: string;
  perksJSON: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type SubscriptionStub = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentStub = {
  id: string;
  userId: string;
  eventId: string | null;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId: string;
  receiptUrl: string | null;
  description: string | null;
  createdAt: Date;
};

type HomepageCarouselImageStub = {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type EventStub = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  startAt: Date;
  endAt: Date;
  venue: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueNotes: string | null;
  venueHiddenUntil: Date | null;
  capacity: number;
  details: string | null;
  visibility: boolean;
  priceCents: number;
  currency: string;
  rsvpDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventRsvpStub = {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  seatGroupId: string | null;
  preferences: unknown;
  noShow: boolean;
  attended: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SeatGroupStub = {
  id: string;
  eventId: string;
  tableNumber: number;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
};

type AuditLogStub = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  diffJSON: unknown;
  createdAt: Date;
};

type MembershipPlanFindUniqueArgs = {
  where: { id?: string; stripePriceId?: string };
};

type MembershipPlanFindManyArgs = {
  where?: { id?: string; stripePriceId?: string };
};

type MembershipPlanUpsertArgs = {
  where: { stripePriceId: string };
  create: {
    name: string;
    stripePriceId: string;
    perksJSON: unknown;
  };
  update: {
    name?: string;
    perksJSON?: unknown;
  };
};

type SubscriptionFindFirstArgs = {
  where?: SubscriptionWhere;
};

type SubscriptionFindManyArgs = {
  where?: SubscriptionWhere;
};

type SubscriptionUpsertArgs = {
  where: { stripeCustomerId: string };
  create: {
    userId: string;
    planId: string;
    status: string;
    currentPeriodEnd?: Date | null;
    stripeCustomerId: string;
  };
  update: {
    userId?: string;
    planId?: string;
    status?: string;
    currentPeriodEnd?: Date | null;
  };
};

type SubscriptionUpdateArgs = {
  where: SubscriptionWhere;
  data: {
    userId?: string;
    planId?: string;
    status?: string;
    currentPeriodEnd?: Date | null;
  };
};

type PaymentFindUniqueArgs = {
  where: { stripePaymentIntentId: string };
};

type PaymentFindManyArgs = {
  where?: PaymentWhere;
  orderBy?: { createdAt?: "asc" | "desc" } | { createdAt?: "asc" | "desc" }[];
};

type PaymentCreateArgs = {
  data: {
    userId: string;
    eventId?: string | null;
    amount: number;
    currency: string;
    status: string;
    stripePaymentIntentId: string;
    receiptUrl?: string | null;
    description?: string | null;
    createdAt?: Date;
  };
};

type PaymentUpdateArgs = {
  where: { stripePaymentIntentId: string };
  data: {
    status?: string;
    receiptUrl?: string | null;
    description?: string | null;
  };
};

type SortDirection = "asc" | "desc";

type HomepageCarouselImageFindManyArgs = {
  orderBy?:
    | { sortOrder?: SortDirection; createdAt?: SortDirection }
    | { sortOrder?: SortDirection; createdAt?: SortDirection }[];
};

type HomepageCarouselImageFindFirstArgs = HomepageCarouselImageFindManyArgs;

type HomepageCarouselImageCreateArgs = {
  data: {
    imageUrl: string;
    altText?: string | null;
    sortOrder?: number;
  };
};

type HomepageCarouselImageDeleteArgs = {
  where: { id: string };
};

type EventFindManyArgs = {
  where?: EventWhere;
};

type EventFindUniqueArgs = {
  where: EventWhere;
};

type EventRsvpFindFirstArgs = {
  where?: EventRsvpWhere;
};

type EventRsvpFindUniqueArgs = {
  where: { userId_eventId: { userId: string; eventId: string } };
};

type EventRsvpUpsertArgs = {
  where: { userId_eventId: { userId: string; eventId: string } };
  create: {
    userId: string;
    eventId: string;
    status?: string;
    seatGroupId?: string | null;
    preferences?: unknown;
    noShow?: boolean;
    attended?: boolean;
  };
  update: {
    status?: string;
    seatGroupId?: string | null;
    preferences?: unknown;
    noShow?: boolean;
    attended?: boolean;
  };
};

type EventCreateArgs = {
  data: {
    slug: string;
    name: string;
    summary: string;
    startAt: Date;
    endAt: Date;
    venue?: string | null;
    venueName?: string | null;
    venueAddress?: string | null;
    venueNotes?: string | null;
    venueHiddenUntil?: Date | null;
    capacity?: number;
    details?: string | null;
    visibility?: boolean;
    priceCents?: number;
    currency?: string;
    rsvpDeadline?: Date | null;
  };
};

type EventUpdateArgs = {
  where: { id: string };
  data: Partial<Omit<EventStub, "id" | "createdAt" | "updatedAt">> & {
    startAt?: Date;
    endAt?: Date;
    venueHiddenUntil?: Date | null;
    rsvpDeadline?: Date | null;
  };
};

type EventCountArgs = {
  where?: EventWhere;
};

type SeatGroupFindManyArgs = {
  where?: { eventId?: string };
};

type SeatGroupCreateArgs = {
  data: {
    eventId: string;
    tableNumber: number;
    capacity?: number;
  };
};

type SeatGroupUpdateArgs = {
  where: { id: string };
  data: {
    tableNumber?: number;
    capacity?: number;
  };
};

type SeatGroupDeleteArgs = {
  where: { id: string };
};

type EventRsvpFindManyArgs = {
  where?: EventRsvpWhere;
};

type EventRsvpUpdateArgs = {
  where: { id: string };
  data: {
    status?: string;
    seatGroupId?: string | null;
    preferences?: unknown;
    noShow?: boolean;
    attended?: boolean;
  };
};

type AuditLogCreateArgs = {
  data: {
    actorId?: string | null;
    actorEmail?: string | null;
    action: string;
    targetType: string;
    targetId: string;
    diffJSON: unknown;
    createdAt?: Date;
  };
};

type AuditLogFindManyArgs = {
  where?: {
    targetType?: string;
    targetId?: string;
  };
  orderBy?: { createdAt: "asc" | "desc" };
  take?: number;
};

type AccountStub = {
  provider_providerAccountId: string;
  provider: string;
  providerAccountId: string;
  type?: string;
  userId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  oauth_token_secret?: string | null;
  oauth_token?: string | null;
};

type AuthenticatorStub = {
  id: string;
  credentialID: string;
  userId: string;
  providerAccountId?: string | null;
  credentialPublicKey?: Buffer | Uint8Array | null;
  counter: number;
  credentialDeviceType?: string | null;
  credentialBackedUp?: boolean;
  transports?: string | null;
};

const stubData = {
  applications: [] as ApplicationStub[],
  users: [] as UserStub[],
  memberProfiles: [] as MemberProfileStub[],
  inviteCodes: [] as InviteCodeStub[],
  sessions: [] as SessionStub[],
  verificationTokens: [] as VerificationTokenStub[],
  accounts: [] as AccountStub[],
  authenticators: [] as AuthenticatorStub[],
  membershipPlans: [] as MembershipPlanStub[],
  subscriptions: [] as SubscriptionStub[],
  payments: [] as PaymentStub[],
  homepageCarouselImages: [] as HomepageCarouselImageStub[],
  events: [] as EventStub[],
  eventRsvps: [] as EventRsvpStub[],
  seatGroups: [] as SeatGroupStub[],
  auditLogs: [] as AuditLogStub[],
};

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function clonePayload(payload: ApplicationPayload): ApplicationPayload {
  return JSON.parse(JSON.stringify(payload)) as ApplicationPayload;
}

function cloneApplication(application: ApplicationStub): ApplicationStub {
  return {
    ...application,
    createdAt: new Date(application.createdAt.getTime()),
    reviewedAt: application.reviewedAt ? new Date(application.reviewedAt.getTime()) : null,
    payload: clonePayload(application.payload),
  };
}

function cloneUser(user: UserStub): UserStub {
  return { ...user };
}

function cloneMembershipPlan(plan: MembershipPlanStub): MembershipPlanStub {
  return {
    ...plan,
    createdAt: new Date(plan.createdAt.getTime()),
    updatedAt: new Date(plan.updatedAt.getTime()),
    perksJSON: JSON.parse(JSON.stringify(plan.perksJSON)),
  };
}

function cloneMemberProfile(profile: MemberProfileStub): MemberProfileStub {
  return {
    ...profile,
    data: JSON.parse(JSON.stringify(profile.data)),
  };
}

function cloneSubscription(subscription: SubscriptionStub): SubscriptionStub {
  return {
    ...subscription,
    currentPeriodEnd: subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd.getTime())
      : null,
    createdAt: new Date(subscription.createdAt.getTime()),
    updatedAt: new Date(subscription.updatedAt.getTime()),
  };
}

function clonePayment(payment: PaymentStub): PaymentStub {
  return {
    ...payment,
    createdAt: new Date(payment.createdAt.getTime()),
  };
}

function cloneHomepageCarouselImage(image: HomepageCarouselImageStub): HomepageCarouselImageStub {
  return {
    ...image,
    createdAt: new Date(image.createdAt.getTime()),
    updatedAt: new Date(image.updatedAt.getTime()),
  };
}

function cloneEvent(event: EventStub): EventStub {
  return {
    ...event,
    startAt: new Date(event.startAt.getTime()),
    endAt: new Date(event.endAt.getTime()),
    venueHiddenUntil: event.venueHiddenUntil ? new Date(event.venueHiddenUntil.getTime()) : null,
    rsvpDeadline: event.rsvpDeadline ? new Date(event.rsvpDeadline.getTime()) : null,
    createdAt: new Date(event.createdAt.getTime()),
    updatedAt: new Date(event.updatedAt.getTime()),
  };
}

function cloneEventRsvp(rsvp: EventRsvpStub): EventRsvpStub {
  return {
    ...rsvp,
    preferences: rsvp.preferences
      ? JSON.parse(JSON.stringify(rsvp.preferences))
      : rsvp.preferences ?? null,
    createdAt: new Date(rsvp.createdAt.getTime()),
    updatedAt: new Date(rsvp.updatedAt.getTime()),
  };
}

function cloneSeatGroup(group: SeatGroupStub): SeatGroupStub {
  return {
    ...group,
    createdAt: new Date(group.createdAt.getTime()),
    updatedAt: new Date(group.updatedAt.getTime()),
  };
}

function cloneAuditLog(entry: AuditLogStub): AuditLogStub {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt.getTime()),
    diffJSON: JSON.parse(JSON.stringify(entry.diffJSON)),
  };
}

function matchesId(value: string | null, filter?: IdFilter): boolean {
  if (!filter) return true;
  if (typeof filter === "string") {
    return value === filter;
  }
  if (!value) return false;
  if (filter.in && Array.isArray(filter.in)) {
    return filter.in.includes(value);
  }
  return true;
}

function matchesString(value: string | null, filter?: StringFilter): boolean {
  if (!filter) return true;
  if (!value) return false;
  if (typeof filter === "string") {
    return value === filter;
  }
  if (filter.contains) {
    const mode = filter.mode === "insensitive" ? "insensitive" : "default";
    const haystack = mode === "insensitive" ? value.toLowerCase() : value;
    const needle = mode === "insensitive" ? filter.contains.toLowerCase() : filter.contains;
    return haystack.includes(needle);
  }
  return true;
}

function matchesStatus(value: ApplicationStatus, filter?: StatusFilter): boolean {
  if (!filter) return true;
  if (typeof filter === "string") {
    return value === filter;
  }
  if (filter.in && Array.isArray(filter.in)) {
    return filter.in.includes(value);
  }
  return true;
}

function matchesStringValue(
  value: string | null,
  filter?: string | { in?: string[] },
): boolean {
  if (!filter) return true;
  if (!value) return false;
  if (typeof filter === "string") {
    return value === filter;
  }
  if (filter.in && Array.isArray(filter.in)) {
    return filter.in.includes(value);
  }
  return true;
}

function matchesWhere(application: ApplicationStub, where?: ApplicationWhere): boolean {
  if (!where) return true;
  if (where.OR && Array.isArray(where.OR) && where.OR.length > 0) {
    const matchesAny = where.OR.some((clause) => matchesWhere(application, clause));
    if (!matchesAny) return false;
  }
  if (where.id && !matchesId(application.id, where.id)) return false;
  if (where.email && !matchesString(application.email, where.email)) return false;
  if (where.fullName && !matchesString(application.fullName, where.fullName)) return false;
  if (where.notes && !matchesString(application.notes, where.notes)) return false;
  if (where.status && !matchesStatus(application.status, where.status)) return false;
  return true;
}

type SubscriptionWhere = {
  id?: string;
  userId?: string;
  planId?: string;
  stripeCustomerId?: string;
  status?: string | { in?: string[] };
};

function matchesSubscription(subscription: SubscriptionStub, where?: SubscriptionWhere): boolean {
  if (!where) return true;
  if (where.id && subscription.id !== where.id) return false;
  if (where.userId && subscription.userId !== where.userId) return false;
  if (where.planId && subscription.planId !== where.planId) return false;
  if (where.stripeCustomerId && subscription.stripeCustomerId !== where.stripeCustomerId) return false;
  if (!matchesStringValue(subscription.status, where.status)) return false;
  return true;
}

type PaymentWhere = {
  userId?: string;
  stripePaymentIntentId?: string;
  eventId?: string;
};

function matchesPayment(payment: PaymentStub, where?: PaymentWhere): boolean {
  if (!where) return true;
  if (where.userId && payment.userId !== where.userId) return false;
  if (where.stripePaymentIntentId && payment.stripePaymentIntentId !== where.stripePaymentIntentId)
    return false;
  if (where.eventId && payment.eventId !== where.eventId) return false;
  return true;
}

type EventWhere = {
  id?: string;
  slug?: string;
  visibility?: boolean;
};

function matchesEvent(event: EventStub, where?: EventWhere): boolean {
  if (!where) return true;
  if (where.id && event.id !== where.id) return false;
  if (where.slug && event.slug !== where.slug) return false;
  if (where.visibility !== undefined && event.visibility !== where.visibility) return false;
  return true;
}

type EventRsvpWhere = {
  id?: string;
  userId?: string;
  eventId?: string;
  status?: string | { in?: string[] };
  seatGroupId?: string | null | { in?: (string | null)[] };
  noShow?: boolean;
  attended?: boolean;
};

function matchesEventRsvp(rsvp: EventRsvpStub, where?: EventRsvpWhere): boolean {
  if (!where) return true;
  if (where.id && rsvp.id !== where.id) return false;
  if (where.userId && rsvp.userId !== where.userId) return false;
  if (where.eventId && rsvp.eventId !== where.eventId) return false;
  if (where.status) {
    if (typeof where.status === "string" && rsvp.status !== where.status) return false;
    if (typeof where.status === "object" && where.status.in && !where.status.in.includes(rsvp.status)) {
      return false;
    }
  }
  if (where.seatGroupId !== undefined) {
    if (typeof where.seatGroupId === "string" && rsvp.seatGroupId !== where.seatGroupId) return false;
    if (where.seatGroupId === null && rsvp.seatGroupId !== null) return false;
    if (
      typeof where.seatGroupId === "object" &&
      where.seatGroupId !== null &&
      Array.isArray(where.seatGroupId.in) &&
      !where.seatGroupId.in.includes(rsvp.seatGroupId)
    ) {
      return false;
    }
  }
  if (where.noShow !== undefined && rsvp.noShow !== where.noShow) return false;
  if (where.attended !== undefined && rsvp.attended !== where.attended) return false;
  return true;
}

function compareValues(a: unknown, b: unknown, direction: "asc" | "desc"): number {
  if (a === b) return 0;
  let comparison = 0;
  if (a instanceof Date && b instanceof Date) {
    comparison = a.getTime() - b.getTime();
  } else if (typeof a === "string" && typeof b === "string") {
    comparison = a.localeCompare(b);
  } else if (typeof a === "number" && typeof b === "number") {
    comparison = a - b;
  }
  return direction === "desc" ? -comparison : comparison;
}

function applyOrder(applications: ApplicationStub[], orderBy: OrderBy): ApplicationStub[] {
  if (!orderBy) return [...applications];
  const rules = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...applications].sort((a, b) => {
    for (const rule of rules) {
      const [[field, direction]] = Object.entries(rule) as [string, "asc" | "desc"][];
      const aValue = (a as Record<string, unknown>)[field];
      const bValue = (b as Record<string, unknown>)[field];
      const result = compareValues(aValue, bValue, direction);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  });
}

function selectReviewer(user: UserStub | null, selection?: ReviewerSelection): { name: string | null; email: string | null } | null {
  if (!user) return null;
  const shouldIncludeName = selection?.select?.name ?? true;
  const shouldIncludeEmail = selection?.select?.email ?? true;
  return {
    name: shouldIncludeName ? user.name : null,
    email: shouldIncludeEmail ? user.email : null,
  };
}

function hydrateApplication(application: ApplicationStub, include?: ApplicationInclude): ApplicationStub & {
  reviewer?: { name: string | null; email: string | null } | null;
} {
  const clone = cloneApplication(application);
  if (include?.reviewer) {
    const reviewer = stubData.users.find((user) => user.id === application.reviewerId) ?? null;
    return {
      ...clone,
      reviewer: selectReviewer(reviewer, include.reviewer),
    };
  }
  return clone;
}

function ensureDefaultData() {
  if (stubData.users.length > 0 || stubData.applications.length > 0) return;

  const adminUser: UserStub = {
    id: "user-admin",
    email: "admin@henrys.club",
    name: "Avery Admin",
    role: Role.ADMIN,
    passwordHash: null,
  };

  const memberUser: UserStub = {
    id: "user-member",
    email: "member@henrys.club",
    name: "Morgan Member",
    role: Role.MEMBER,
    passwordHash: null,
  };

  stubData.users.push(adminUser, memberUser);

  const basePayload: ApplicationPayload = {
    fullName: "Sample Applicant",
    email: "sample@henrys.club",
    age: 29,
    city: "London",
    occupation: "Product Manager",
    linkedin: "https://www.linkedin.com/in/sample",
    instagram: "",
    motivation: "I am excited to meet thoughtful people in the city and share new experiences.",
    threeWords: "Curious, generous, adventurous",
    perfectSaturday: "Morning pilates, afternoon gallery hopping, and a late dinner at a cozy spot.",
    dietary: "Vegetarian",
    dietaryNotes: "",
    alcohol: "Wine with dinner",
    vibe: 6,
    availability: "Weekends and some weeknights",
    dealBreakers: ["Smoking"],
    consentCode: "on",
    consentData: "on",
  };

  const submitted = createStubApplication({
    id: "app-submitted",
    email: "jane@example.com",
    fullName: "Jane Summer",
    status: ApplicationStatus.SUBMITTED,
    payload: { ...basePayload, email: "jane@example.com", fullName: "Jane Summer" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  });

  const waitlisted = createStubApplication({
    id: "app-waitlist",
    email: "taylor@example.com",
    fullName: "Taylor Moon",
    status: ApplicationStatus.WAITLIST,
    payload: { ...basePayload, email: "taylor@example.com", fullName: "Taylor Moon" },
    notes: "Fantastic energy, keep warm for next salon.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    reviewerId: adminUser.id,
  });

  stubData.applications.push(submitted, waitlisted);

  if (stubData.membershipPlans.length === 0) {
    const monthly: MembershipPlanStub = {
      id: "plan-monthly",
      name: "Founding Monthly",
      stripePriceId:
        process.env.STRIPE_FOUNDING_MONTHLY_PRICE_ID ?? "price_founding_monthly",
      perksJSON: ["Priority RSVPs", "Members-only salons"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const annual: MembershipPlanStub = {
      id: "plan-annual",
      name: "Founding Annual",
      stripePriceId:
        process.env.STRIPE_FOUNDING_ANNUAL_PRICE_ID ?? "price_founding_annual",
      perksJSON: ["Priority RSVPs", "Guest invitations", "Founders' supper"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stubData.membershipPlans.push(monthly, annual);
  }

  if (stubData.homepageCarouselImages.length === 0) {
    const defaults: HomepageCarouselImageStub[] = [
      {
        id: "carousel-1",
        imageUrl:
          "https://images.unsplash.com/photo-1529634898388-84d0fb4fb9b8?auto=format&fit=crop&w=1024&q=80",
        altText: "Couple clinking cocktails at a candlelit bar table.",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "carousel-2",
        imageUrl:
          "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1024&q=80",
        altText: "Friends laughing together in a vibrant lounge.",
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "carousel-3",
        imageUrl:
          "https://images.unsplash.com/photo-1544075571-21005b86c60c?auto=format&fit=crop&w=1024&q=80",
        altText: "Couple sharing a toast in a dimly lit speakeasy.",
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "carousel-4",
        imageUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1024&q=80",
        altText: "Elegant pair posing beside the bar lights.",
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    stubData.homepageCarouselImages.push(...defaults);
  }

  if (stubData.events.length === 0) {
    const now = Date.now();
    const sampleEvent: EventStub = {
      id: "event-salon",
      slug: "founders-salon",
      name: "Founders' Salon",
      summary: "An evening of slow dating and brilliant conversation.",
      startAt: new Date(now + 1000 * 60 * 60 * 24 * 5),
      endAt: new Date(now + 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 120),
      venue: "Soho loft",
      venueName: "Soho Loft",
      venueAddress: "123 Mercer St, New York",
      venueNotes: "Buzz 12 for entry.",
      venueHiddenUntil: new Date(now + 1000 * 60 * 60 * 24 * 2),
      capacity: 30,
      details:
        "Dress sharp, bring stories. This salon welcomes founders, creatives, and the wildly curious.",
      visibility: true,
      priceCents: 4500,
      currency: "usd",
      rsvpDeadline: new Date(now + 1000 * 60 * 60 * 24 * 4),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stubData.events.push(sampleEvent);

    const defaultGroups: SeatGroupStub[] = Array.from({ length: 5 }).map((_, index) => ({
      id: `seat-${index + 1}`,
      eventId: sampleEvent.id,
      tableNumber: index + 1,
      capacity: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    stubData.seatGroups.push(...defaultGroups);
  }
}

function createStubApplication(overrides: Partial<ApplicationStub> = {}): ApplicationStub {
  const now = new Date();
  const payload: ApplicationPayload = overrides.payload
    ? clonePayload(overrides.payload)
    : ({} as ApplicationPayload);
  return {
    id: overrides.id ?? nextId("application"),
    email: overrides.email ?? "applicant@henrys.club",
    fullName: overrides.fullName ?? "Sample Applicant",
    status: overrides.status ?? ApplicationStatus.SUBMITTED,
    payload,
    notes: overrides.notes ?? null,
    createdAt: overrides.createdAt ? new Date(overrides.createdAt.getTime()) : now,
    reviewedAt: overrides.reviewedAt ? new Date(overrides.reviewedAt.getTime()) : null,
    reviewerId: overrides.reviewerId ?? null,
    applicantId: overrides.applicantId ?? null,
  };
}

function resolveUser(where: UserWhere): UserStub | null {
  ensureDefaultData();
  if (typeof where.id === "string") {
    return stubData.users.find((user) => user.id === where.id) ?? null;
  }
  if (typeof where.id === "object" && where.id?.in?.length) {
    const [firstId] = where.id.in;
    if (firstId) {
      return stubData.users.find((user) => user.id === firstId) ?? null;
    }
  }
  if (typeof where.email === "string") {
    return stubData.users.find((user) => user.email === where.email) ?? null;
  }
  if (typeof where.email === "object" && where.email?.in?.length) {
    const [firstEmail] = where.email.in;
    if (firstEmail) {
      return stubData.users.find((user) => user.email === firstEmail) ?? null;
    }
  }
  return null;
}

function matchesUserWhere(user: UserStub, where?: UserWhere): boolean {
  if (!where) {
    return true;
  }
  if (where.id !== undefined) {
    if (typeof where.id === "string" && user.id !== where.id) {
      return false;
    }
    if (typeof where.id === "object") {
      const ids = where.id?.in ?? [];
      if (ids.length > 0 && !ids.includes(user.id)) {
        return false;
      }
    }
  }
  if (where.email !== undefined) {
    if (typeof where.email === "string" && user.email !== where.email) {
      return false;
    }
    if (typeof where.email === "object") {
      const emails = where.email?.in ?? [];
      if (emails.length > 0 && !emails.includes(user.email)) {
        return false;
      }
    }
  }
  if (where.role !== undefined) {
    if (typeof where.role === "string" && user.role !== where.role) {
      return false;
    }
    if (typeof where.role === "object") {
      const roles = where.role?.in ?? [];
      if (roles.length > 0 && !roles.includes(user.role)) {
        return false;
      }
    }
  }
  return true;
}

class PrismaClientStub {
  constructor() {
    ensureDefaultData();
  }

  application = {
    findFirst: async (args?: ApplicationArgs) => {
      const [first] = await this.application.findMany(args);
      return first ?? null;
    },
    findMany: async (args?: ApplicationArgs) => {
      ensureDefaultData();
      const filtered = stubData.applications.filter((application) => matchesWhere(application, args?.where));
      const sorted = applyOrder(filtered, args?.orderBy);
      return sorted.map((application) => hydrateApplication(application, args?.include));
    },
    findUnique: async (args: { where: ApplicationWhere; include?: ApplicationInclude }) => {
      const match = stubData.applications.find((application) => matchesWhere(application, args.where));
      return match ? hydrateApplication(match, args.include) : null;
    },
    update: async (args: ApplicationUpdateArgs) => {
      const target = stubData.applications.find((application) => application.id === args.where.id);
      if (!target) {
        throw new Error(`Application with id ${args.where.id} not found in stub.`);
      }
      if (args.data.email !== undefined) target.email = args.data.email;
      if (args.data.fullName !== undefined) target.fullName = args.data.fullName;
      if (args.data.payload !== undefined) target.payload = clonePayload(args.data.payload);
      if (args.data.status !== undefined) target.status = args.data.status;
      if (args.data.notes !== undefined) target.notes = args.data.notes ?? null;
      if (args.data.reviewedAt !== undefined) {
        target.reviewedAt = args.data.reviewedAt ? new Date(args.data.reviewedAt.getTime()) : null;
      }
      if (args.data.reviewerId !== undefined) {
        target.reviewerId = args.data.reviewerId;
      }
      if (args.data.applicantId !== undefined) {
        target.applicantId = args.data.applicantId;
      }
      if (args.data.createdAt !== undefined) {
        target.createdAt = new Date(args.data.createdAt.getTime());
      }
      return hydrateApplication(target, args.include);
    },
    create: async (args: ApplicationCreateArgs) => {
      const application = createStubApplication({
        email: args.data.email,
        fullName: args.data.fullName,
        payload: (args.data.payload ?? {}) as ApplicationPayload,
        status: args.data.status ?? ApplicationStatus.SUBMITTED,
        notes: args.data.notes ?? null,
      });
      stubData.applications.push(application);
      return hydrateApplication(application, args.include);
    },
    count: async (args?: { where?: ApplicationWhere }) => {
      ensureDefaultData();
      return stubData.applications.filter((application) => matchesWhere(application, args?.where)).length;
    },
  };

  user = {
    findUnique: async (args: { where: UserWhere }) => {
      const user = resolveUser(args.where);
      return user ? cloneUser(user) : null;
    },
    findFirst: async (args?: { where?: UserWhere }) => {
      ensureDefaultData();
      if (!args?.where) {
        return stubData.users.length ? cloneUser(stubData.users[0]!) : null;
      }
      const user = stubData.users.find((candidate) => matchesUserWhere(candidate, args.where));
      return user ? cloneUser(user) : null;
    },
    findMany: async (args?: { where?: UserWhere }) => {
      ensureDefaultData();
      return stubData.users
        .filter((user) => matchesUserWhere(user, args?.where))
        .map((user) => cloneUser(user));
    },
    create: async (args: UserCreateArgs) => {
      const existing = stubData.users.find((user) => user.email === args.data.email);
      if (existing) {
        return cloneUser(existing);
      }
      const user: UserStub = {
        id: nextId("user"),
        email: args.data.email,
        name: args.data.name ?? null,
        role: args.data.role ?? Role.MEMBER,
        passwordHash: args.data.passwordHash ?? null,
      };
      stubData.users.push(user);
      return cloneUser(user);
    },
    update: async (args: UserUpdateArgs) => {
      const target = resolveUser(args.where);
      if (!target) {
        throw new Error("User not found in stub");
      }
      if (args.data.email !== undefined) target.email = args.data.email;
      if (args.data.name !== undefined) target.name = args.data.name ?? null;
      if (args.data.role !== undefined) target.role = args.data.role;
      if (args.data.passwordHash !== undefined) target.passwordHash = args.data.passwordHash ?? null;
      return cloneUser(target);
    },
    delete: async (args: { where: UserWhere }) => {
      const user = resolveUser(args.where);
      if (!user) {
        throw new Error("User not found in stub");
      }
      stubData.users = stubData.users.filter((candidate) => candidate.id !== user.id);
      return cloneUser(user);
    },
    count: async (args?: { where?: UserWhere }) => {
      ensureDefaultData();
      return stubData.users.filter((user) => matchesUserWhere(user, args?.where)).length;
    },
  };

  memberProfile = {
    findUnique: async (args: { where: { userId: string } }) => {
      ensureDefaultData();
      const profile = stubData.memberProfiles.find((entry) => entry.userId === args.where.userId);
      return profile ? cloneMemberProfile(profile) : null;
    },
    findMany: async (args?: { where?: { userId?: string; userId_in?: string[] } }) => {
      ensureDefaultData();
      let profiles = stubData.memberProfiles;
      if (args?.where) {
        profiles = profiles.filter((entry) => {
          if (args.where?.userId && entry.userId !== args.where.userId) return false;
          if (args.where?.userId_in && !args.where.userId_in.includes(entry.userId)) return false;
          return true;
        });
      }
      return profiles.map((profile) => cloneMemberProfile(profile));
    },
    upsert: async (args: MemberProfileUpsertArgs) => {
      ensureDefaultData();
      let profile = stubData.memberProfiles.find((entry) => entry.userId === args.where.userId);
      if (profile) {
        profile.data = { ...profile.data, ...args.update };
      } else {
        profile = {
          id: nextId("profile"),
          userId: args.where.userId,
          data: { ...args.create },
        };
        stubData.memberProfiles.push(profile);
      }
      return cloneMemberProfile(profile);
    },
  };

  inviteCode = {
    create: async (args: InviteCodeCreateArgs) => {
      const invite: InviteCodeStub = {
        id: nextId("invite"),
        code: args.data.code,
        applicationId: args.data.applicationId,
        userId: args.data.userId,
        expiresAt: new Date(args.data.expiresAt.getTime()),
      };
      stubData.inviteCodes.push(invite);
      return { ...invite };
    },
  };

  verificationToken = {
    create: async (args: VerificationTokenCreateArgs) => {
      const token: VerificationTokenStub = {
        identifier: args.data.identifier,
        token: args.data.token,
        expires: new Date(args.data.expires.getTime()),
      };
      stubData.verificationTokens.push(token);
      return { ...token };
    },
    delete: async (args: VerificationTokenDeleteArgs) => {
      const index = stubData.verificationTokens.findIndex(
        (candidate) =>
          candidate.identifier === args.where.identifier_token.identifier &&
          candidate.token === args.where.identifier_token.token,
      );
      if (index === -1) {
        const error = new Error("P2025");
        (error as Error & { code?: string }).code = "P2025";
        throw error;
      }
      const [removed] = stubData.verificationTokens.splice(index, 1);
      return { ...removed };
    },
  };

  membershipPlan = {
    findMany: async (args?: MembershipPlanFindManyArgs) => {
      ensureDefaultData();
      let plans = stubData.membershipPlans;
      if (args?.where) {
        plans = plans.filter((plan) => {
          if (args.where?.id && plan.id !== args.where.id) return false;
          if (args.where?.stripePriceId && plan.stripePriceId !== args.where.stripePriceId) return false;
          return true;
        });
      }
      return plans.map((plan) => cloneMembershipPlan(plan));
    },
    findUnique: async (args: MembershipPlanFindUniqueArgs) => {
      ensureDefaultData();
      const plan = stubData.membershipPlans.find((entry) => {
        if (args.where.id && entry.id === args.where.id) return true;
        if (args.where.stripePriceId && entry.stripePriceId === args.where.stripePriceId) return true;
        return false;
      });
      return plan ? cloneMembershipPlan(plan) : null;
    },
    upsert: async (args: MembershipPlanUpsertArgs) => {
      ensureDefaultData();
      let plan = stubData.membershipPlans.find(
        (entry) => entry.stripePriceId === args.where.stripePriceId,
      );
      if (plan) {
        if (args.update.name !== undefined) plan.name = args.update.name;
        if (args.update.perksJSON !== undefined)
          plan.perksJSON = JSON.parse(JSON.stringify(args.update.perksJSON));
        plan.updatedAt = new Date();
      } else {
        plan = {
          id: nextId("plan"),
          name: args.create.name,
          stripePriceId: args.create.stripePriceId,
          perksJSON: JSON.parse(JSON.stringify(args.create.perksJSON)),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        stubData.membershipPlans.push(plan);
      }
      return cloneMembershipPlan(plan);
    },
  };

  subscription = {
    findFirst: async (args?: SubscriptionFindFirstArgs) => {
      ensureDefaultData();
      const subscription = stubData.subscriptions.find((entry) =>
        matchesSubscription(entry, args?.where),
      );
      return subscription ? cloneSubscription(subscription) : null;
    },
    findMany: async (args?: SubscriptionFindManyArgs) => {
      ensureDefaultData();
      const matches = stubData.subscriptions.filter((entry) =>
        matchesSubscription(entry, args?.where),
      );
      return matches.map((entry) => cloneSubscription(entry));
    },
    upsert: async (args: SubscriptionUpsertArgs) => {
      ensureDefaultData();
      let subscription = stubData.subscriptions.find(
        (entry) => entry.stripeCustomerId === args.where.stripeCustomerId,
      );
      if (subscription) {
        if (args.update.userId !== undefined) subscription.userId = args.update.userId;
        if (args.update.planId !== undefined) subscription.planId = args.update.planId;
        if (args.update.status !== undefined) subscription.status = args.update.status;
        if (args.update.currentPeriodEnd !== undefined) {
          subscription.currentPeriodEnd = args.update.currentPeriodEnd
            ? new Date(args.update.currentPeriodEnd.getTime())
            : null;
        }
        subscription.updatedAt = new Date();
      } else {
        subscription = {
          id: nextId("subscription"),
          userId: args.create.userId,
          planId: args.create.planId,
          status: args.create.status,
          currentPeriodEnd: args.create.currentPeriodEnd
            ? new Date(args.create.currentPeriodEnd.getTime())
            : null,
          stripeCustomerId: args.create.stripeCustomerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        stubData.subscriptions.push(subscription);
      }
      return cloneSubscription(subscription);
    },
    update: async (args: SubscriptionUpdateArgs) => {
      ensureDefaultData();
      const subscription = stubData.subscriptions.find((entry) =>
        matchesSubscription(entry, args.where),
      );
      if (!subscription) {
        throw new Error("Subscription not found in stub");
      }
      if (args.data.userId !== undefined) subscription.userId = args.data.userId;
      if (args.data.planId !== undefined) subscription.planId = args.data.planId;
      if (args.data.status !== undefined) subscription.status = args.data.status;
      if (args.data.currentPeriodEnd !== undefined) {
        subscription.currentPeriodEnd = args.data.currentPeriodEnd
          ? new Date(args.data.currentPeriodEnd.getTime())
          : null;
      }
      subscription.updatedAt = new Date();
      return cloneSubscription(subscription);
    },
  };

  payment = {
    findUnique: async (args: PaymentFindUniqueArgs) => {
      ensureDefaultData();
      const payment = stubData.payments.find(
        (entry) => entry.stripePaymentIntentId === args.where.stripePaymentIntentId,
      );
      return payment ? clonePayment(payment) : null;
    },
    findMany: async (args?: PaymentFindManyArgs) => {
      ensureDefaultData();
      let payments = stubData.payments.filter((entry) => matchesPayment(entry, args?.where));
      if (args?.orderBy) {
        const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
        payments = [...payments].sort((a, b) => {
          for (const order of orders) {
            if (order?.createdAt) {
              const diff = a.createdAt.getTime() - b.createdAt.getTime();
              if (diff !== 0) {
                return order.createdAt === "desc" ? -diff : diff;
              }
            }
          }
          return 0;
        });
      }
      return payments.map((entry) => clonePayment(entry));
    },
    create: async (args: PaymentCreateArgs) => {
      ensureDefaultData();
      const payment: PaymentStub = {
        id: nextId("payment"),
        userId: args.data.userId,
        eventId: args.data.eventId ?? null,
        amount: args.data.amount,
        currency: args.data.currency,
        status: args.data.status,
        stripePaymentIntentId: args.data.stripePaymentIntentId,
        receiptUrl: args.data.receiptUrl ?? null,
        description: args.data.description ?? null,
        createdAt: args.data.createdAt
          ? new Date(args.data.createdAt.getTime())
          : new Date(),
      };
      stubData.payments.push(payment);
      return clonePayment(payment);
    },
    update: async (args: PaymentUpdateArgs) => {
      ensureDefaultData();
      const payment = stubData.payments.find(
        (entry) => entry.stripePaymentIntentId === args.where.stripePaymentIntentId,
      );
      if (!payment) {
        throw new Error("Payment not found in stub");
      }
      if (args.data.status !== undefined) payment.status = args.data.status;
      if (args.data.receiptUrl !== undefined) payment.receiptUrl = args.data.receiptUrl;
      if (args.data.description !== undefined) payment.description = args.data.description;
      return clonePayment(payment);
    },
  };

  homepageCarouselImage = {
    findMany: async (args?: HomepageCarouselImageFindManyArgs) => {
      ensureDefaultData();
      let images = stubData.homepageCarouselImages.map((image) =>
        cloneHomepageCarouselImage(image),
      );

      if (args?.orderBy) {
        const rules = Array.isArray(args.orderBy)
          ? args.orderBy
          : [args.orderBy];
        for (const rule of rules) {
          if (rule.sortOrder) {
            const direction = rule.sortOrder;
            images = images.sort((a, b) =>
              direction === "asc"
                ? a.sortOrder - b.sortOrder
                : b.sortOrder - a.sortOrder,
            );
            continue;
          }
          if (rule.createdAt) {
            const direction = rule.createdAt;
            images = images.sort((a, b) =>
              direction === "asc"
                ? a.createdAt.getTime() - b.createdAt.getTime()
                : b.createdAt.getTime() - a.createdAt.getTime(),
            );
          }
        }
      }

      return images;
    },
    findFirst: async (args?: HomepageCarouselImageFindFirstArgs) => {
      const results = await this.homepageCarouselImage.findMany({
        orderBy: args?.orderBy,
      });
      return results[0] ?? null;
    },
    create: async (args: HomepageCarouselImageCreateArgs) => {
      ensureDefaultData();
      const image: HomepageCarouselImageStub = {
        id: nextId("carousel"),
        imageUrl: args.data.imageUrl,
        altText: args.data.altText ?? null,
        sortOrder:
          args.data.sortOrder ??
          (stubData.homepageCarouselImages[stubData.homepageCarouselImages.length - 1]?.sortOrder ?? 0) +
            1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      stubData.homepageCarouselImages.push(image);
      return cloneHomepageCarouselImage(image);
    },
    delete: async (args: HomepageCarouselImageDeleteArgs) => {
      ensureDefaultData();
      const index = stubData.homepageCarouselImages.findIndex(
        (image) => image.id === args.where.id,
      );
      if (index === -1) {
        throw new Error("Carousel image not found in stub");
      }
      const [removed] = stubData.homepageCarouselImages.splice(index, 1);
      return cloneHomepageCarouselImage(removed);
    },
  };

  event = {
    findMany: async (args?: EventFindManyArgs) => {
      ensureDefaultData();
      const matches = stubData.events.filter((entry) => matchesEvent(entry, args?.where));
      return matches.map((entry) => cloneEvent(entry));
    },
    findUnique: async (args: EventFindUniqueArgs) => {
      ensureDefaultData();
      const event = stubData.events.find((entry) => matchesEvent(entry, args.where));
      return event ? cloneEvent(event) : null;
    },
    create: async (args: EventCreateArgs) => {
      ensureDefaultData();
      if (stubData.events.some((entry) => entry.slug === args.data.slug)) {
        throw new Error(`Event with slug ${args.data.slug} already exists in stub.`);
      }
      const now = new Date();
      const event: EventStub = {
        id: nextId("event"),
        slug: args.data.slug,
        name: args.data.name,
        summary: args.data.summary,
        startAt: new Date(args.data.startAt.getTime()),
        endAt: new Date(args.data.endAt.getTime()),
        venue: args.data.venue ?? null,
        venueName: args.data.venueName ?? null,
        venueAddress: args.data.venueAddress ?? null,
        venueNotes: args.data.venueNotes ?? null,
        venueHiddenUntil: args.data.venueHiddenUntil
          ? new Date(args.data.venueHiddenUntil.getTime())
          : null,
        capacity: args.data.capacity ?? 40,
        details: args.data.details ?? null,
        visibility: args.data.visibility ?? true,
        priceCents: args.data.priceCents ?? 0,
        currency: args.data.currency ?? "usd",
        rsvpDeadline: args.data.rsvpDeadline ? new Date(args.data.rsvpDeadline.getTime()) : null,
        createdAt: now,
        updatedAt: now,
      };
      stubData.events.push(event);
      return cloneEvent(event);
    },
    update: async (args: EventUpdateArgs) => {
      ensureDefaultData();
      const event = stubData.events.find((entry) => entry.id === args.where.id);
      if (!event) {
        throw new Error(`Event with id ${args.where.id} not found in stub.`);
      }
      if (args.data.slug !== undefined) event.slug = args.data.slug;
      if (args.data.name !== undefined) event.name = args.data.name;
      if (args.data.summary !== undefined) event.summary = args.data.summary;
      if (args.data.startAt !== undefined) event.startAt = new Date(args.data.startAt.getTime());
      if (args.data.endAt !== undefined) event.endAt = new Date(args.data.endAt.getTime());
      if (args.data.venue !== undefined) event.venue = args.data.venue;
      if (args.data.venueName !== undefined) event.venueName = args.data.venueName;
      if (args.data.venueAddress !== undefined) event.venueAddress = args.data.venueAddress;
      if (args.data.venueNotes !== undefined) event.venueNotes = args.data.venueNotes;
      if (args.data.venueHiddenUntil !== undefined) {
        event.venueHiddenUntil = args.data.venueHiddenUntil
          ? new Date(args.data.venueHiddenUntil.getTime())
          : null;
      }
      if (args.data.capacity !== undefined) event.capacity = args.data.capacity;
      if (args.data.details !== undefined) event.details = args.data.details;
      if (args.data.visibility !== undefined) event.visibility = args.data.visibility;
      if (args.data.priceCents !== undefined) event.priceCents = args.data.priceCents;
      if (args.data.currency !== undefined) event.currency = args.data.currency;
      if (args.data.rsvpDeadline !== undefined) {
        event.rsvpDeadline = args.data.rsvpDeadline
          ? new Date(args.data.rsvpDeadline.getTime())
          : null;
      }
      event.updatedAt = new Date();
      return cloneEvent(event);
    },
    count: async (args?: EventCountArgs) => {
      ensureDefaultData();
      return stubData.events.filter((entry) => matchesEvent(entry, args?.where)).length;
    },
  };

  eventRsvp = {
    findFirst: async (args?: EventRsvpFindFirstArgs) => {
      ensureDefaultData();
      const rsvp = stubData.eventRsvps.find((entry) => matchesEventRsvp(entry, args?.where));
      return rsvp ? cloneEventRsvp(rsvp) : null;
    },
    findMany: async (args?: EventRsvpFindManyArgs) => {
      ensureDefaultData();
      const matches = stubData.eventRsvps.filter((entry) => matchesEventRsvp(entry, args?.where));
      return matches.map((entry) => cloneEventRsvp(entry));
    },
    findUnique: async (args: EventRsvpFindUniqueArgs) => {
      ensureDefaultData();
      const { userId, eventId } = args.where.userId_eventId;
      const rsvp = stubData.eventRsvps.find(
        (entry) => entry.userId === userId && entry.eventId === eventId,
      );
      return rsvp ? cloneEventRsvp(rsvp) : null;
    },
    upsert: async (args: EventRsvpUpsertArgs) => {
      ensureDefaultData();
      const { userId, eventId } = args.where.userId_eventId;
      let rsvp = stubData.eventRsvps.find(
        (entry) => entry.userId === userId && entry.eventId === eventId,
      );
      if (rsvp) {
        if (args.update.status !== undefined) rsvp.status = args.update.status;
        if (args.update.seatGroupId !== undefined) rsvp.seatGroupId = args.update.seatGroupId ?? null;
        if (args.update.preferences !== undefined)
          rsvp.preferences = args.update.preferences
            ? JSON.parse(JSON.stringify(args.update.preferences))
            : args.update.preferences ?? null;
        if (args.update.noShow !== undefined) rsvp.noShow = args.update.noShow;
        if (args.update.attended !== undefined) rsvp.attended = args.update.attended;
        rsvp.updatedAt = new Date();
      } else {
        rsvp = {
          id: nextId("eventRsvp"),
          userId,
          eventId,
          status: args.create.status ?? "WAITLISTED",
          seatGroupId: args.create.seatGroupId ?? null,
          preferences: args.create.preferences
            ? JSON.parse(JSON.stringify(args.create.preferences))
            : args.create.preferences ?? null,
          noShow: args.create.noShow ?? false,
          attended: args.create.attended ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        stubData.eventRsvps.push(rsvp);
      }
      return cloneEventRsvp(rsvp);
    },
    update: async (args: EventRsvpUpdateArgs) => {
      ensureDefaultData();
      const rsvp = stubData.eventRsvps.find((entry) => entry.id === args.where.id);
      if (!rsvp) {
        throw new Error(`Event RSVP with id ${args.where.id} not found in stub.`);
      }
      if (args.data.status !== undefined) rsvp.status = args.data.status;
      if (args.data.seatGroupId !== undefined) rsvp.seatGroupId = args.data.seatGroupId ?? null;
      if (args.data.preferences !== undefined)
        rsvp.preferences = args.data.preferences
          ? JSON.parse(JSON.stringify(args.data.preferences))
          : args.data.preferences ?? null;
      if (args.data.noShow !== undefined) rsvp.noShow = args.data.noShow;
      if (args.data.attended !== undefined) rsvp.attended = args.data.attended;
      rsvp.updatedAt = new Date();
      return cloneEventRsvp(rsvp);
    },
  };

  seatGroup = {
    findMany: async (args?: SeatGroupFindManyArgs) => {
      ensureDefaultData();
      const matches = stubData.seatGroups.filter((entry) => {
        if (!args?.where) return true;
        if (args.where.eventId && entry.eventId !== args.where.eventId) return false;
        return true;
      });
      return matches.map((entry) => cloneSeatGroup(entry));
    },
    create: async (args: SeatGroupCreateArgs) => {
      ensureDefaultData();
      const group: SeatGroupStub = {
        id: nextId("seat"),
        eventId: args.data.eventId,
        tableNumber: args.data.tableNumber,
        capacity: args.data.capacity ?? 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      stubData.seatGroups.push(group);
      return cloneSeatGroup(group);
    },
    update: async (args: SeatGroupUpdateArgs) => {
      ensureDefaultData();
      const group = stubData.seatGroups.find((entry) => entry.id === args.where.id);
      if (!group) {
        throw new Error(`Seat group with id ${args.where.id} not found in stub.`);
      }
      if (args.data.tableNumber !== undefined) group.tableNumber = args.data.tableNumber;
      if (args.data.capacity !== undefined) group.capacity = args.data.capacity;
      group.updatedAt = new Date();
      return cloneSeatGroup(group);
    },
    delete: async (args: SeatGroupDeleteArgs) => {
      ensureDefaultData();
      const index = stubData.seatGroups.findIndex((entry) => entry.id === args.where.id);
      if (index === -1) {
        throw new Error(`Seat group with id ${args.where.id} not found in stub.`);
      }
      const [removed] = stubData.seatGroups.splice(index, 1);
      for (const rsvp of stubData.eventRsvps) {
        if (rsvp.seatGroupId === removed.id) {
          rsvp.seatGroupId = null;
          rsvp.updatedAt = new Date();
        }
      }
      return cloneSeatGroup(removed);
    },
  };

  auditLog = {
    create: async (args: AuditLogCreateArgs) => {
      ensureDefaultData();
      const entry: AuditLogStub = {
        id: nextId("audit"),
        actorId: args.data.actorId ?? null,
        actorEmail: args.data.actorEmail ?? null,
        action: args.data.action,
        targetType: args.data.targetType,
        targetId: args.data.targetId,
        diffJSON: JSON.parse(JSON.stringify(args.data.diffJSON ?? {})),
        createdAt: args.data.createdAt ? new Date(args.data.createdAt.getTime()) : new Date(),
      };
      stubData.auditLogs.push(entry);
      return cloneAuditLog(entry);
    },
    findMany: async (args?: AuditLogFindManyArgs) => {
      ensureDefaultData();
      let matches = stubData.auditLogs;
      if (args?.where) {
        matches = matches.filter((entry) => {
          if (args.where?.targetType && entry.targetType !== args.where.targetType) return false;
          if (args.where?.targetId && entry.targetId !== args.where.targetId) return false;
          return true;
        });
      }
      if (args?.orderBy?.createdAt) {
        const direction = args.orderBy.createdAt;
        matches = [...matches].sort((a, b) =>
          direction === "desc"
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime(),
        );
      }
      if (args?.take !== undefined) {
        matches = matches.slice(0, args.take);
      }
      return matches.map((entry) => cloneAuditLog(entry));
    },
  };

  session = {
    create: async (args: SessionCreateArgs) => {
      const session: SessionStub = {
        id: nextId("session"),
        sessionToken: args.data.sessionToken,
        userId: args.data.userId,
        expires: new Date(args.data.expires.getTime()),
      };
      stubData.sessions.push(session);
      return { ...session };
    },
    update: async (args: SessionUpdateArgs) => {
      const target = stubData.sessions.find((session) => session.sessionToken === args.where.sessionToken);
      if (!target) {
        throw new Error("Session not found in stub");
      }
      if (args.data.sessionToken !== undefined) target.sessionToken = args.data.sessionToken;
      if (args.data.userId !== undefined) target.userId = args.data.userId;
      if (args.data.expires !== undefined) target.expires = new Date(args.data.expires.getTime());
      return { ...target };
    },
    delete: async (args: SessionDeleteArgs) => {
      const index = stubData.sessions.findIndex((session) => session.sessionToken === args.where.sessionToken);
      if (index === -1) {
        throw new Error("Session not found in stub");
      }
      const [removed] = stubData.sessions.splice(index, 1);
      return { ...removed };
    },
    findUnique: async (args: SessionFindUniqueArgs) => {
      const session = stubData.sessions.find((entry) => entry.sessionToken === args.where.sessionToken);
      if (!session) return null;
      if (args.include?.user) {
        const user = stubData.users.find((candidate) => candidate.id === session.userId) ?? null;
        return {
          ...session,
          user: user ? cloneUser(user) : null,
        };
      }
      return { ...session };
    },
    deleteMany: async (args?: SessionDeleteManyArgs) => {
      if (!args?.where?.user?.email) {
        const count = stubData.sessions.length;
        stubData.sessions = [];
        return { count };
      }
      const matchingUserIds = stubData.users
        .filter((user) => user.email === args.where?.user?.email)
        .map((user) => user.id);
      const before = stubData.sessions.length;
      stubData.sessions = stubData.sessions.filter((session) => !matchingUserIds.includes(session.userId));
      return { count: before - stubData.sessions.length };
    },
  };

  account = {
    create: async (args: AccountCreateArgs) => {
      const compositeId = `${args.data.provider}_${args.data.providerAccountId}`;
      const account: AccountStub = {
        provider_providerAccountId: compositeId,
        provider: args.data.provider,
        providerAccountId: args.data.providerAccountId,
        type: args.data.type,
        userId: args.data.userId,
        refresh_token: args.data.refresh_token,
        access_token: args.data.access_token,
        expires_at: args.data.expires_at,
        token_type: args.data.token_type,
        scope: args.data.scope,
        id_token: args.data.id_token,
        session_state: args.data.session_state,
        oauth_token_secret: args.data.oauth_token_secret,
        oauth_token: args.data.oauth_token,
      };
      stubData.accounts.push(account);
      return { ...account };
    },
    delete: async (args: AccountDeleteArgs) => {
      const index = stubData.accounts.findIndex(
        (account) => account.provider_providerAccountId === args.where.provider_providerAccountId,
      );
      if (index === -1) {
        throw new Error("Account not found in stub");
      }
      const [removed] = stubData.accounts.splice(index, 1);
      return { ...removed };
    },
    findUnique: async (args: AccountFindUniqueArgs) => {
      const account = stubData.accounts.find(
        (entry) => entry.provider_providerAccountId === args.where.provider_providerAccountId,
      );
      if (!account) return null;
      if (args.include?.user) {
        const user = stubData.users.find((candidate) => candidate.id === account.userId) ?? null;
        return { ...account, user: user ? cloneUser(user) : null };
      }
      return { ...account };
    },
    findFirst: async (args: AccountFindFirstArgs) => {
      const account = stubData.accounts.find((entry) => {
        if (args.where.provider && entry.provider !== args.where.provider) return false;
        if (args.where.providerAccountId && entry.providerAccountId !== args.where.providerAccountId) return false;
        return true;
      });
      return account ? { ...account } : null;
    },
  };

  authenticator = {
    create: async (args: AuthenticatorCreateArgs) => {
      const authenticator: AuthenticatorStub = {
        id: args.data.id ?? nextId("authenticator"),
        credentialID: args.data.credentialID,
        userId: args.data.userId,
        providerAccountId: args.data.providerAccountId ?? null,
        credentialPublicKey: args.data.credentialPublicKey ?? null,
        counter: args.data.counter ?? 0,
        credentialDeviceType: args.data.credentialDeviceType ?? null,
        credentialBackedUp: args.data.credentialBackedUp ?? false,
        transports: args.data.transports ?? null,
      };
      stubData.authenticators.push(authenticator);
      return { ...authenticator };
    },
    findUnique: async (args: { where: { credentialID: string } }) => {
      const authenticator = stubData.authenticators.find(
        (entry) => entry.credentialID === args.where.credentialID,
      );
      return authenticator ? { ...authenticator } : null;
    },
    findMany: async (args: AuthenticatorFindManyArgs) => {
      return stubData.authenticators
        .filter((entry) => entry.userId === args.where.userId)
        .map((entry) => ({ ...entry }));
    },
    update: async (args: AuthenticatorUpdateArgs) => {
      const authenticator = stubData.authenticators.find(
        (entry) => entry.credentialID === args.where.credentialID,
      );
      if (!authenticator) {
        throw new Error("Authenticator not found in stub");
      }
      if (args.data.counter !== undefined) {
        authenticator.counter = args.data.counter;
      }
      return { ...authenticator };
    },
  };

  async $transaction<T>(callback: (client: this) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async $disconnect(): Promise<void> {
    // no-op for stub
  }
}

const resolvedDatabaseUrl =
  [
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ]
    .map((value) => value?.trim())
    .find((value) => value && value.length > 0) ?? "";

if (!process.env.DATABASE_URL && resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const isExplicitlyDisabled = process.env.USE_PRISMA_CLIENT === "false";
const preferRealClient =
  !isExplicitlyDisabled &&
  (process.env.USE_PRISMA_CLIENT === "true" ||
    (resolvedDatabaseUrl !== "" && !resolvedDatabaseUrl.startsWith("file:")));

const PrismaClientCtor = await (async () => {
  if (!preferRealClient) {
    return PrismaClientStub;
  }
  try {
    const prismaModule = await import("@prisma/client");
    return prismaModule.PrismaClient;
  } catch {
    return PrismaClientStub;
  }
})();

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClientCtor> | undefined;
};
function instantiatePrismaClient(): InstanceType<typeof PrismaClientCtor> {
  if (PrismaClientCtor === PrismaClientStub) {
    return new PrismaClientStub() as InstanceType<typeof PrismaClientCtor>;
  }

  try {
    return new PrismaClientCtor({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("@prisma/client did not initialize")) {
      return new PrismaClientStub() as InstanceType<typeof PrismaClientCtor>;
    }
    throw error;
  }
}

const prismaClient = globalForPrisma.prisma ?? instantiatePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
