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

function greeting(name: string) {
  if (!name) return "Hey there";
  return `Hi ${name.split(" ")[0] ?? name}`;
}
