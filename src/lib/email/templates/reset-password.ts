import { SITE_COPY } from "../../site-copy";

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

export function resetPasswordTemplate({
    resetLink,
}: {
    resetLink: string;
}) {
    return `
<mjml>
  <mj-head>
    <mj-title>Reset your password</mj-title>
    ${baseStyles}
  </mj-head>
  <mj-body background-color="#f6f7f9">
    <mj-section background-color="#ffffff" padding="32px" border-radius="24px">
      <mj-column>
        <mj-text font-size="24px" font-weight="600" css-class="body-copy">Reset your password</mj-text>
        <mj-text font-size="16px" line-height="1.6" css-class="body-copy">
          We received a request to reset the password for your ${SITE_COPY.name} account. If you didn't make this request, you can safely ignore this email.
        </mj-text>
        <mj-button background-color="#111827" color="#ffffff" href="${resetLink}" padding="12px 0" border-radius="24px">
          Reset password
        </mj-button>
        <mj-text font-size="13px" css-class="muted">If the button doesn't work, paste this into your browser:<br />${resetLink}</mj-text>
      </mj-column>
    </mj-section>
    ${footer}
  </mj-body>
</mjml>`;
}
