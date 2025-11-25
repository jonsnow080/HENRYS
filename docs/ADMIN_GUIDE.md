# HENRYS – Admin Guide

This document explains how to use the HENRYS admin console as an operator, host, or internal team member.

---

## Access & Roles

Admin tools are accessible under the `/admin` path.

Access is controlled by user roles:

- `ADMIN` – Full access to admin console
- `HOST` – Limited access focused on events, RSVPs, and host sheets
- `MEMBER` – No direct admin access

If you cannot see the admin pages, contact an existing admin to confirm your account and role.

---

## Admin Home

**URL:** `/admin`

The admin home should give you quick links into:

- Applications
- Events
- RSVPs & seating
- Homepage carousel
- Email previews

Use this as your starting point.

---

## Managing Applications

**URL:** `/admin/applications`

Use this section to review new applications and manage the funnel from applicant to member.

Typical workflow:

1. **Browse the list**
   - Filter by status (e.g. new, in review, accepted, rejected).
   - Sort by submission date, last updated, or other relevant fields.

2. **Open an application**
   - Review the structured responses.
   - Check any notes left by other reviewers.
   - Pay attention to PII; avoid sharing screenshots outside the team.

3. **Leave notes**
   - Use internal notes for quick impressions and decision rationale.
   - Keep notes concise but clear enough for other admins to understand.

4. **Decide**
   - Mark the application as accepted, rejected, or needs more information.
   - If accepted, move to the invite step (see below).

---

## Issuing Invite Codes

Invite-related tools may appear:

- Within each application detail
- In a dedicated section (if present)

When issuing an invite:

1. **Link to the correct user/application**
   - Make sure the invite code is tied to the right email or user record.
   - Double-check the email spelling.

2. **Generate an invite code**
   - Use the “generate invite code” action.
   - Optionally set:
     - Expiration date
     - Maximum uses (usually 1)

3. **Send the invite**
   - Either:
     - Trigger an email from within the admin console, or
     - Copy the invite link and send it manually using approved channels.

4. **Monitor redemption**
   - Check whether the invite has been redeemed.
   - Follow up if needed.

Once redeemed, the user’s role should move from `APPLICANT` (or `GUEST`) to an appropriate role (typically `MEMBER`), and the onboarding/profile flow should complete.

---

## Membership & Billing

Many membership and billing details are primarily managed in **Stripe**, but the admin console may show:

- Current subscriptions
- Plan types (founding monthly/annual)
- Links to Stripe customer or subscription records

Guidelines:

- Use the app to understand a member’s current status.
- Use Stripe’s dashboard for:
  - Manual subscription changes
  - Refunds
  - Card updates
  - Charge disputes

If you make changes in Stripe, ensure the app’s data stays in sync via webhooks; if not, contact engineering.

---

## Events

**URL:** `/admin/events`

This section manages the event lifecycle.

### Creating an Event

When creating a new event, set:

- **Title & description**
- **Date & time**
- **Venue / location details**
- **Capacity** (total seats)
- **Pricing** (free vs paid, base ticket price)
- **Visibility**
  - Draft (hidden)
  - Published (visible to members)
  - Archived (past events, no new RSVPs)

After saving, verify that the event appears correctly on the member-facing `/events` page (once published).

### Editing an Event

You can edit:

- Copy (title, description)
- Schedule
- Capacity
- Pricing
- Visibility

Considerations:

- Do not reduce capacity below the number of already-confirmed RSVPs without a plan.
- Be careful when changing price once members have purchased tickets.

---

## RSVPs & Seating

**URL:** `/admin/events/[eventId]/rsvps`  
**URL:** `/admin/events/[eventId]/match`

Use these subpages for managing who is coming and where they sit.

### RSVPs

The RSVPs page should show:

- Member name
- RSVP status (e.g. pending, confirmed, canceled)
- Payment status (if applicable)
- Any notes or flags relevant to seating/hosting

Typical actions:

- Confirm or cancel RSVPs (when manual overrides are necessary)
- Add internal notes
- Filter by status or payment state

### Seat Groups & Matching

On the matching/seating page:

1. **Define seat groups**
   - Create seat groups representing tables or sections.
   - Set capacities per group.

2. **Assign RSVPs**
   - Use any available auto-matching tools to generate proposed seating.
   - Manually adjust assignments for:
     - Balancing age ranges
     - Gender balance
     - Avoiding conflicts

3. **Review**
   - Look at the full seating chart to ensure:
     - No group is over capacity.
     - Every confirmed RSVP is assigned or explicitly unassigned by choice.

---

## Host Sheets

**URL:**  
- `/admin/events/[eventId]/match/export`  
- `/admin/events/[eventId]/match/host-sheet`

Host sheet endpoints generate a printable or exportable summary for event hosts.

They typically include:

- Event details (time, venue, key notes)
- Table/seat group breakdown
- Guests per table with:
  - Name
  - Age bracket or other limited profile data
  - Internal notes, if appropriate

Before exporting:

1. Finalize seating assignments.
2. Double-check that only necessary information is included (avoid oversharing PII).
3. Generate the host sheet and review it for clarity.

---

## Homepage Carousel

**URL:** `/admin/homepage-carousel`

Use this to manage marketing imagery and content on the public homepage.

Actions:

- Add new images with:
  - Alt text
  - Optional captions or tags
- Reorder images
- Remove outdated or off-brand content

Ensure all images:

- Are licensed for use
- Match brand tone and quality
- Have meaningful alt text for accessibility

---

## Email Previews

**URL:** `/admin/email-previews`

This section shows previews of transactional email templates (magic links, confirmations, receipts, etc.).

Use it to:

- Quickly review the latest copy for core templates
- Confirm branding, layout and footer
- Check dynamic sections using test examples

If something looks wrong:

- Capture the template name and context.
- Open an issue for engineering with screenshots and notes.

---

## Data Sensitivity & Privacy

Admins and hosts routinely see sensitive data:

- Application responses with PII
- Member profile details
- Billing-related context (never full card numbers, but still sensitive info)

Guidelines:

- Only access data you need for your current task.
- Avoid sending screenshots that contain PII in external channels.
- Use first names or initials when possible in external conversations.
- If you suspect a data leak or misuse:
  - Report it immediately to the appropriate internal channel.

---

## Getting Help

If something in the admin goes wrong:

- Capture:
  - The URL (e.g. `/admin/events/...`)
  - What you were trying to do
  - Any error message you saw
- Take a screenshot if possible.
- Share it with the engineering or ops channel so they can investigate.
