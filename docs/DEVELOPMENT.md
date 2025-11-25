# HENRYS – Development Guide

This document explains how to work on the HENRYS web app as an engineer.

It assumes you’ve already skimmed:

- `README.md` – high-level overview
- `docs/ARCHITECTURE.md` – system design and data model

---

## Local Setup

### 1. Environment

- Ensure Node.js (LTS) and pnpm are installed.
- Have access to a PostgreSQL instance (local Docker or cloud).
- Make sure you have test-mode credentials for:
  - Stripe
  - Resend (or SMTP)
- Create your local env file (for example `.env.local`) and fill in values from `docs/ENVIRONMENT.md`.

### 2. Database

- Run Prisma migrations to keep your schema in sync:

  - Use the migrate script configured in `package.json`  
    (for example: `pnpm prisma migrate dev`).

- If a seed script is available, run it to create:
  - A few test users with different roles
  - Sample applications and invite codes
  - A couple of membership plans linked to Stripe prices
  - At least one event with RSVPs

This makes it easier to test flows end-to-end without setting up everything manually.

---

## Everyday Dev Workflow

1. **Start your local Postgres** (Docker or local service).
2. **Start the dev server** using the configured script (for example: `pnpm dev`).
3. Visit the app in your browser and:
   - Hit public pages (`/`, `/about`, `/apply`)
   - Walk through login and dashboard flows
4. Keep your console open for:
   - Next.js server logs
   - Prisma/query errors
   - Stripe webhook logs (when testing payments)

---

## Working in the Main Domains

### Applications & Invitations

Key concepts:

- `Application` records store applicant data and review state.
- `InviteCode` records store issuer, redemption, and lifecycle metadata.
- Roles will evolve: `APPLICANT` → `MEMBER` after invite and onboarding.

When changing the application flow:

- Validate all public inputs with a schema library (e.g. Zod).
- Ensure confirmation emails are still sent and rendered correctly.
- Keep admin triage views focused (list vs detail) and avoid over-exposing PII.

When changing the invite flow:

- Make sure invite codes remain unique and time-bounded as needed.
- Ensure invite codes can’t be reused once redeemed.
- Think about what happens if you re-send or regenerate an invite.

### Auth & RBAC

Auth is handled by Auth.js (NextAuth) with a Prisma adapter.

When modifying auth:

- Keep magic-link flows working (email provider, verification tokens).
- If you modify credentials login, ensure:
  - Passwords are hashed with bcrypt
  - New users can’t bypass the invite/membership logic unless intended
- If you add new roles or permissions:
  - Update role enums in both Prisma schema and TS code
  - Update middleware/route guards
  - Review admin UI filters and conditionals

### Membership & Payments

Stripe integration backs membership subscriptions and event tickets.

When changing membership logic:

- Keep Stripe as the source of truth for billing.
- Webhooks should remain **idempotent**:
  - Guard by Stripe event ID or payment intent ID.
  - Use upsert patterns in Prisma where appropriate.
- `Subscription` and `Payment` tables must stay in sync with Stripe:
  - Subscription status updates (active, canceled, past_due, etc.)
  - Payment success, refund, or failure

Always test flows in **Stripe test mode**:

- New subscriber joining the founding plan
- Upgrades/downgrades (if supported)
- Cancellations via Billing Portal
- Refunds or failed payments

### Events, RSVPs, and Seating

When changing event logic:

- Keep `Event` records as the single source for schedule, venue, capacity, and base pricing.
- `EventRsvp` should include:
  - RSVP state
  - Link to `Payment` (if paid)
  - Any seating-related flags

Seating:

- `SeatGroup` represents tables/groups for an event’s seating plan.
- RSVP records can be assigned to seat groups.
- Host sheet exports should always reflect:
  - Final seating assignments
  - Relevant member profile slices (age windows, basic notes)

If you tweak seating heuristics:

- Keep them configurable and simple at first (e.g., by age or gender mix).
- Log the matching decisions during development to understand behavior.

---

## Testing

### Unit & Integration (Vitest)

Use Vitest for:

- Stripe webhook handlers
- Core domain logic (applications, invites, membership lifecycle)
- Utility functions (rate limiter, formatting, validation)

When adding tests for webhooks:

- Cover:
  - Happy paths for subscription creation/updates
  - Idempotency (same event delivered twice)
  - Failure modes (invalid signatures, missing data)

### E2E (Playwright)

Use Playwright + axe for:

- End-to-end flows:
  - Apply → invite → sign-in → subscribe → RSVP to event
  - Admin triage of applications
  - Admin event management and host sheet export
- Accessibility checks on key pages (home, apply, dashboard, events, admin)

Start small: a single “smoke test” that covers the primary happy path is better than none.

---

## Code Quality & Conventions

- **TypeScript**
  - Aim for strict types in critical domains (payments, auth, roles).
  - Avoid `any`, especially around Stripe payloads and Prisma models.

- **Lint & format**
  - Use ESLint and Prettier via the scripts in `package.json`.
  - Run linting and formatting before opening a PR.

- **Branching & PRs**
  - Use feature branches, e.g. `feature/events-seating-refactor`.
  - Keep PRs small and focused on a single concern.
  - Include screenshots or short notes for UI changes.

---

## Database Changes

Whenever you change the Prisma schema:

1. Update the schema file.
2. Run Prisma migrate to generate a new migration.
3. Verify the migration on a local database.
4. Update any seed scripts if you rely on specific data.
5. Consider indexes and foreign-key constraints when working on:
   - RSVPs and events (fast lookups)
   - Subscription and payments (Stripe IDs, uniqueness)
   - Invite codes (unique code, redemption guard)

Remember that **deleting** an `Event` that has RSVPs should either be restricted or carefully cascaded; the default posture is to avoid destructive operations that lose historical data.

---

## Observability & Security (Dev Responsibilities)

As you work on the app:

- Prefer structured logs around:
  - Stripe webhook processing
  - Authentication and role transitions
  - Admin actions that touch PII or money
- Avoid logging:
  - Full card/billing details (Stripe already handles this)
  - Highly sensitive PII from applications and member profiles
- When you touch auth, payments, or PII:
  - Double-check the security headers and CSP configuration.
  - Keep rate limiting in mind, especially for:
    - Auth endpoints
    - Application forms
