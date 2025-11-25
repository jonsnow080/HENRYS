# HENRYS Web App

HENRYS is a mobile-first, invite-only IRL dating and members’ club.

This repository contains the **web app** that powers:

- Applications → invitations → onboarding
- Paid memberships with Stripe
- Event discovery, RSVPs, tickets, and seating/matching
- Admin tooling for applications, events, and homepage content
- Transactional email (auth links, confirmations, receipts)

---

## Features

- **Application funnel**
  - Public application form
  - Admin triage and review notes
  - Invite-code issuance and tracking

- **Auth & roles**
  - Auth.js (NextAuth) with email magic links (Resend/SMTP)
  - Optional credentials login (bcryptjs)
  - Roles: `GUEST`, `APPLICANT`, `MEMBER`, `HOST`, `ADMIN`
  - RBAC via Next.js middleware to guard member/host/admin routes

- **Membership & billing**
  - Membership plans backed by Stripe prices
  - Stripe Checkout sessions for subscribing
  - Stripe Billing Portal for self-serve management
  - Webhooks that keep `Subscription` and `Payment` in sync

- **Events & tickets**
  - Browse upcoming events
  - Event detail view with capacity, pricing, and RSVP state
  - Ticket checkout via Stripe
  - RSVP records + optional seating assignment
  - Host sheet export for events

- **Admin console**
  - Application triage
  - Event CRUD + capacity/pricing
  - RSVPs & seating planner (seat groups / tables)
  - Homepage carousel management
  - Email previews (for templates already in code)

- **Email**
  - Transactional mail via Resend or SMTP
  - MJML templates with safe HTML fallbacks
  - Emails for magic links, confirmations, and receipts

---

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Auth:** Auth.js (NextAuth) with Prisma adapter
- **Database:** PostgreSQL via Prisma
- **Payments:** Stripe (Checkout, Billing Portal, webhooks)
- **Email:** Resend (primary) or SMTP via Nodemailer + MJML
- **Styling:** Tailwind CSS, custom UI primitives
- **Tooling:** pnpm, ESLint, Prettier, Vitest, Playwright (scaffolded)

For a deeper architectural overview, see `docs/ARCHITECTURE.md`.

---

## Core Flows (at a glance)

1. **Applications**
   - Visitor submits an application on `/apply`
   - Application stored in the database
   - Applicant receives confirmation email
   - Admins review, add notes, and decide whether to issue an invite

2. **Invitations & onboarding**
   - Admin issues an invite code linked to an email (optional)
   - Invitee signs in with magic link or password
   - On first sign-in, profile is created; user role is updated

3. **Membership**
   - Member chooses a plan
   - Backend creates a Stripe Checkout session
   - On success, Stripe webhooks upsert `Subscription` + `Payment`
   - Member can access Stripe Billing Portal from the dashboard

4. **Events & tickets**
   - Members browse events under `/events`
   - For an event, member can RSVP / purchase tickets via Stripe
   - Webhooks confirm payment and update `EventRsvp`
   - Optional seat grouping and host sheet exports for hosts/admins

5. **Admin operations**
   - `/admin` is the entry point for:
     - Application triage
     - Events and RSVPs
     - Seating / matching
     - Homepage carousel
     - Email templates & previews

---

## Getting Started (Local Development)

### Prerequisites

- Node.js (LTS recommended)
- pnpm
- PostgreSQL database (local or cloud)
- Stripe account (for API keys, test mode is fine)
- Resend account or SMTP credentials (for email)

### 1. Install dependencies

From the project root:

- Install packages using the package manager configured in `package.json`  
  (for example: `pnpm install`).

### 2. Configure environment variables

Create a local environment file (commonly `.env.local` or `.env` depending on your setup).

Populate the required keys using `docs/ENVIRONMENT.md` as your source of truth.

At minimum you’ll need:

- Database URL(s)
- Auth/NextAuth secrets + URL
- Stripe secret & publishable keys + webhook secret
- Email provider keys (Resend or SMTP)
- Site URL(s)
- Misc settings like `INVITE_CODE_SALT` and rate-limit configuration

### 3. Run database migrations

Use Prisma to bring your local database schema up to date.

- Use the Prisma migration script configured in `package.json`  
  (for example: `pnpm prisma migrate dev`).

If you have a seed script configured, you can run it to bootstrap test data  
(for example: `pnpm prisma db seed`).

### 4. Start the development server

Start the Next.js dev server using the script defined in `package.json`  
(for example: `pnpm dev`).

By default the app will be available on a local port (commonly `http://localhost:3000`).

---

## Testing

The repo is set up for both unit and end-to-end tests:

- **Unit / integration tests**
  - Written with Vitest + Testing Library
  - Use the test script configured in `package.json`  
    (for example: `pnpm test` or `pnpm test:unit`)

- **E2E tests**
  - Playwright + axe integration is scaffolded for accessibility checks
  - Use the E2E script configured in `package.json`  
    (for example: `pnpm test:e2e`)

---

## Environments & Deployment

Typical environment setup:

- **Local development** – `.env.local` / `.env`, local Postgres, Stripe test keys
- **Staging** – Hosted Next.js app, managed Postgres, Stripe test or a separate test account
- **Production** – Hosted Next.js app (e.g., Vercel), managed Postgres, Stripe live keys

Deployment notes:

- Stripe webhooks must point at the `/api/stripe/webhooks` route
- Stripe-related routes must use the **Node runtime**, not Edge
- Run Prisma migrations as part of your deploy process
- Consider enabling Sentry (or similar) for error tracking in both SSR and API routes

See internal infra notes or your platform’s docs for the exact deployment commands.

---

## Documentation

- `docs/ARCHITECTURE.md` – Architecture & data model overview
- `docs/DEVELOPMENT.md` – How to work on this codebase day-to-day
- `docs/ENVIRONMENT.md` – Environment variables and configuration
- `docs/ADMIN_GUIDE.md` – How admins should use the product

---

## License

This codebase is private and proprietary to HENRYS.  
Do not distribute or reuse without explicit permission.
