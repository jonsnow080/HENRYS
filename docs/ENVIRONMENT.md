# HENRYS – Environment & Configuration

This document describes the environment variables used by the HENRYS web app and how to configure them for local development, staging, and production.

---

## Files

Common patterns (adjust to your actual setup):

- Local: `.env.local` or `.env`
- Staging: environment variables managed via your hosting provider
- Production: environment variables managed via your hosting provider and/or a secrets manager

Never commit real secrets to the repository.

---

## Auth & NextAuth

Used to configure Auth.js (NextAuth) and auth-related URLs.

- `AUTH_SECRET`  
  Secret used for auth-related crypto (JWT signing, etc.).

- `NEXTAUTH_SECRET`  
  Secret used by NextAuth. Often this can match `AUTH_SECRET`.

- `AUTH_URL` / `NEXTAUTH_URL`  
  The base URL where the app is accessible (scheme + host).  
  Examples:
  - Local: `http://localhost:3000`
  - Staging: `https://henrys-staging.example.com`
  - Production: `https://henrys.example.com`

In many setups, `NEXTAUTH_URL` is required by Auth.js to correctly generate callback URLs.

---

## Database

Prisma targets PostgreSQL.

- `DATABASE_URL`  
  Primary connection string for Prisma to reach Postgres.  
  Example (local):  
  `postgresql://user:password@localhost:5432/henrys?schema=public`

- `POSTGRES_PRISMA_URL` (optional)  
  Alternate connection string if your hosting provider uses indirection or pooling.  
  In some setups, this may mirror `DATABASE_URL` or point to a pooled endpoint.

Make sure the database user has permissions for:

- Creating tables
- Running migrations
- Reading and writing all relevant schemas

---

## Stripe

Used for memberships and event payments.

- `STRIPE_SECRET_KEY`  
  The Stripe secret key (e.g. `sk_test_...` or `sk_live_...`).

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
  The publishable key used in the browser (e.g. `pk_test_...`).

- `STRIPE_WEBHOOK_SECRET`  
  The signing secret for the Stripe webhook endpoint.  
  This must match the secret configured for the webhook in the Stripe dashboard.

- `STRIPE_FOUNDING_MONTHLY_PRICE_ID`  
  Price ID for the founding monthly plan.

- `STRIPE_FOUNDING_ANNUAL_PRICE_ID`  
  Price ID for the founding annual plan.

You may add more price IDs as additional membership plans are introduced. Keep plan metadata and Stripe IDs in sync between code and Stripe.

---

## Email Providers

The app supports Resend (primary) and optional SMTP.

- `AUTH_RESEND_KEY` or `RESEND_API_KEY`  
  API key for Resend. Used by the email adapter for sending magic links and transactional email.

- `AUTH_EMAIL_FROM`  
  Default “From” email address used by Auth.js emails and other transactional messages.  
  Example: `HENRYS <no-reply@henrys.example.com>`

If using SMTP, you may also configure:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE` (optional, e.g. `true`/`false`)

Make sure that DNS, SPF, DKIM, and DMARC are configured on your domain so email reliably lands in inboxes.

---

## Site URLs

Used to build links inside emails and for canonical URLs.

- `SITE_URL`  
  The canonical URL for the site (usually production).

- `NEXT_PUBLIC_SITE_URL`  
  A browser-safe version of the site URL for client-side code.

Typical pattern:

- Local: `http://localhost:3000`
- Staging: `https://henrys-staging.example.com`
- Production: `https://henrys.example.com`

---

## Miscellaneous

- `INVITE_CODE_SALT`  
  A secret string used when generating or verifying invite codes.  
  Changing this in production can invalidate existing codes, so treat it carefully.

- `RATE_LIMIT_MAX_REQUESTS`  
  Integer. Maximum requests allowed within the configured window.

- `RATE_LIMIT_WINDOW_SECONDS`  
  Integer. Time window in seconds used by the rate limiter.

- `USE_MJML`  
  Boolean-like (`true`/`false` as a string).  
  Controls whether to render email templates via MJML. When disabled, the app may use pre-rendered HTML templates instead.

---

## Local vs Production Considerations

- In **local dev**, you can use Stripe test keys, Resend test keys, and a local Postgres instance.  
  Make sure to run Stripe CLI or a tunneling solution if you want to test actual webhooks locally.

- In **staging**, you should:
  - Use test-mode Stripe keys.
  - Consider a separate Postgres database from production.
  - Use a real email provider but with test recipients or a sandbox.

- In **production**, you must:
  - Use live Stripe keys and webhook secrets.
  - Use a production-grade Postgres instance (with backups and monitoring).
  - Use verified domains for email.
  - Lock down access to all secrets with a proper secrets manager and minimal access policies.

---

## Boot-Time Validation

It is recommended that the app validates required env vars on boot in production:

- Fail fast if critical keys (database, Stripe, auth, email) are missing.
- Optionally log warnings for optional keys with sensible defaults.

This reduces “mystery failures” where a missing key only surfaces during a user action.
