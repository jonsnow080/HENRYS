import { SITE_COPY } from "../site-copy";

const baseStyles = `
  <mj-style>
    .body-copy { font-family: 'Helvetica Neue', Arial, sans-serif; color: #161616; }
    .muted { color: #6b7280; }
    .button { background-color: #111827; color: #ffffff; padding: 16px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; }
  </mj-style>
`;

const footer = `
  <mj-section padding="24px 0 0">
    <mj-column>
      <mj-text font-size="12px" css-class="muted">
        ${SITE_COPY.name} · ${SITE_COPY.city}
      </mj-text>
    </mj-column>
  </mj-section>
`;

export function applicationConfirmationTemplate({
  name,
}: {
  name: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>${SITE_COPY.name} Application</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="24px" font-weight="600" css-class="body-copy">${greeting(name)},</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          Thanks for applying to ${SITE_COPY.name}. We read every response personally and will be in touch within a few days.
        </mj-text>
        <mj-text font-size="16px" css-class="body-copy">
          In the meantime, keep an eye on your inbox for any follow-up questions from the team.
        </mj-text>
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

export function inviteTemplate({
  name,
  magicLink,
  inviteCode,
}: {
  name: string;
  magicLink: string;
  inviteCode?: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>Welcome to ${SITE_COPY.name}</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="24px" font-weight="600" css-class="body-copy">Welcome, ${name.split(" ")[0] ?? name}!</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          You're approved. Tap below to glide into your ${SITE_COPY.name} dashboard.
        </mj-text>
        <mj-button background-color="#111827" color="#ffffff" href="${magicLink}" padding="12px 0" border-radius="24px">
          One-click access
        </mj-button>
        ${inviteCode ? `<mj-text font-size="16px" css-class="body-copy">Your personal invite code: <strong>${inviteCode}</strong></mj-text>` : ""}
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

export function magicLinkTemplate({
  url,
}: {
  url: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>Sign in to ${SITE_COPY.name}</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="22px" font-weight="600" css-class="body-copy">Your magic link has arrived ✨</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          This link expires in 15 minutes. Tap below on the device you want to stay signed in on.
        </mj-text>
        <mj-button background-color="#111827" color="#ffffff" href="${url}" padding="12px 0" border-radius="24px">
          Open HENRYS
        </mj-button>
        <mj-text font-size="13px" css-class="muted">If the button doesn't work, paste this into your browser:<br />${url}</mj-text>
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

export function paymentReceiptTemplate({
  amount,
  description,
  receiptUrl,
}: {
  amount: string;
  description: string;
  receiptUrl?: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>${SITE_COPY.name} receipt</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="22px" font-weight="600" css-class="body-copy">Thanks for supporting ${SITE_COPY.name}</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          ${description}<br /><strong>${amount}</strong>
        </mj-text>
        <mj-text font-size="14px" css-class="muted">
          Tickets and memberships do not include food or drink. We'll have curated options available for purchase on the night.
        </mj-text>
        ${
          receiptUrl
            ? `<mj-button background-color="#111827" color="#ffffff" href="${receiptUrl}" padding="12px 0" border-radius="24px">View Stripe receipt</mj-button>`
            : ""
        }
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

export function waitlistPromotionTemplate({
  name,
  eventName,
  eventDate,
  price,
}: {
  name: string;
  eventName: string;
  eventDate: string;
  price: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>Your ${SITE_COPY.name} seat is confirmed</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="22px" font-weight="600" css-class="body-copy">See you at ${eventName}, ${name.split(" ")[0] ?? name}.</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          We promoted you from the waitlist and confirmed your ticket (${price}). Calendar details and host notes will follow shortly.
        </mj-text>
        <mj-text font-size="16px" css-class="body-copy">${eventDate}</mj-text>
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

export function waitlistCheckoutTemplate({
  name,
  eventName,
  eventDate,
  checkoutUrl,
  holdMinutes,
  price,
}: {
  name: string;
  eventName: string;
  eventDate: string;
  checkoutUrl: string;
  holdMinutes: number;
  price: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>Your ${SITE_COPY.name} waitlist invite</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="22px" font-weight="600" css-class="body-copy">You're next up, ${name.split(" ")[0] ?? name}.</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          A seat just opened for <strong>${eventName}</strong> (${price}). Use the button below to complete checkout in the next ${holdMinutes} minutes before we invite the next person in queue.
        </mj-text>
        <mj-text font-size="16px" css-class="body-copy">${eventDate}</mj-text>
        <mj-button background-color="#111827" color="#ffffff" href="${checkoutUrl}" padding="12px 0" border-radius="24px">
          Confirm my ticket
        </mj-button>
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

export function refundNotificationTemplate({
  name,
  eventName,
  amountLabel,
  message,
}: {
  name: string;
  eventName: string;
  amountLabel: string | null;
  message: string;
}) {
  return `
<mjml>
  <mj-head>
    <mj-title>${SITE_COPY.name} refund processed</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="16px" css-class="body-copy">Hi ${name.split(" ")[0] ?? name},</mj-text>
        <mj-text font-size="22px" font-weight="600" css-class="body-copy">We've released your seat for ${eventName}.</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          ${
            amountLabel
              ? `We've issued a ${amountLabel} refund back to your original payment method.`
              : "This cancellation isn’t eligible for a refund."
          }
        </mj-text>
        <mj-text font-size="14px" css-class="muted">${message}</mj-text>
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}

function greeting(name: string) {
  if (!name) return "Hey there";
  return `Hi ${name.split(" ")[0] ?? name}`;
}
