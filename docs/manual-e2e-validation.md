# Manual end-to-end validation: apply → invite → login → subscribe → RSVP

This checklist walks through a full critical path in **Stripe test mode** and how to verify database state, outbound email, and webhook idempotency. Follow the steps in order and record evidence for each gate.

## Prerequisites
- `.env` configured with test credentials for Postgres, Stripe (test secret key + webhook secret), auth providers, and email (Resend **or** SMTP). Restart the dev server after updating env vars.
- Local services running: `pnpm dev` for the Next.js app and the Stripe CLI webhook forwarder, e.g. `stripe listen --forward-to localhost:3000/api/stripe/webhooks`.
- Admin/staff account available to approve applications and send invites.
- Clean test data: either a fresh database or clearly identified test emails (e.g., `qa+flow1@example.com`) so you can query them without collisions.

## 1) Apply
1. Visit `/apply` and submit the form with a trusted personal email domain.
2. Expect redirect to `/apply/success?email=...`.
3. Verify persistence and role state:
   - `applications` table has a new row with `status=SUBMITTED` and `payload.email` matching the form entry.
   - `applicants` table is upserted for the same email.
   - `users` table should **not** gain a member role yet; any existing user should remain `GUEST`.
4. Email: the applicant should receive the application confirmation template (check Resend logs or SMTP inbox; if email delivery is disabled, confirm console output from `sendEmail`).

## 2) Invite
1. In the admin UI (`/admin/applications`), approve the new application and send an invite.
2. Verify persistence:
   - Approved application has `status=APPROVED`, `reviewerId` set, and `inviteCodes` related to it.
   - `invite_codes` table row contains the invite `code`, `applicationId`, `createdById` (reviewer), and `redeemedAt` is `NULL`.
3. Email: the invite email renders the personal invite code and links into the login/signup flow.

## 3) Login with invite
1. Follow the invite link/code and complete auth via the public login page.
2. On successful authentication, confirm:
   - A `users` row exists for the invitee email with role promoted to at least `APPLICANT` (eventual membership happens at subscription).
   - `invite_codes.userId` is set to the new user and `redeemedAt` populated.
   - A `sessions` entry exists for the signed-in browser session.

## 4) Subscribe (Stripe test checkout)
1. From the dashboard subscribe card, trigger membership checkout and pay with Stripe test card `4242 4242 4242 4242`.
2. Confirm Stripe events arrive at `/api/stripe/webhooks`:
   - `checkout.session.completed` should create or update `subscriptions` with the plan tied to `stripePriceId` and `stripeCustomerId`.
   - `customer.subscription.updated`/`created` keep `subscriptions.status` in sync and set `currentPeriodEnd`.
3. Verify database state after webhook completion:
   - `subscriptions` row connected to the user, with the correct `planId`, `status` (`active` in test), and `stripeCustomerId` from the session.
   - `users.role` elevated to `MEMBER` if business rules require membership on active subscription.
4. Email: receipt/confirmation email from Stripe (if enabled) plus any internal welcome email should render correctly.

## 5) RSVP to an event (paid or free)
1. Open an event detail page (`/events/[slug]`) while logged in and submit the RSVP or ticket purchase flow.
2. For paid events, complete Stripe checkout and let webhooks process.
3. Verify database state:
   - `event_rsvps` contains a unique row for `[userId, eventId]` with `status` `GOING` or `WAITLISTED` depending on capacity.
   - For paid events, `payments` has `stripePaymentIntentId`, `status` from the webhook payload, and optional `receiptUrl`; `eventId` links the payment to the event.

## Webhook idempotency checks
- Re-deliver recent Stripe events via Stripe CLI (`stripe trigger` or dashboard “Send test webhook”) and ensure no duplicate rows appear:
  - `subscriptions` should **not** create additional rows for the same `stripeCustomerId`/`stripePriceId` combination.
  - `payments` should remain a single row per `stripePaymentIntentId`; reruns may update `status`/`receiptUrl` but not insert duplicates.
  - `event_rsvps` must stay unique on `[userId, eventId]`.
- Review application logs for idempotency guards—no thrown unique-constraint errors or unhandled exceptions during retries.

## Evidence to capture
- Screenshots of each UI step (apply success, invite email, dashboard subscription state, event RSVP confirmation).
- Database snapshots (Prisma Studio or SQL output) showing the expected rows and status values for the test email and event.
- Stripe CLI logs demonstrating webhook deliveries and successful retries without new records.
- Email previews from Resend/SMTP inbox for all sent templates.
