export const EMAIL_DOMAIN = "henrys.club" as const;

export const EMAIL_CONTACTS = {
  support: `support@${EMAIL_DOMAIN}`,
  partners: `partners@${EMAIL_DOMAIN}`,
  press: `press@${EMAIL_DOMAIN}`,
  hello: `hello@${EMAIL_DOMAIN}`,
  about: `about@${EMAIL_DOMAIN}`,
  events: `events@${EMAIL_DOMAIN}`,
  noReply: `no-reply@${EMAIL_DOMAIN}`,
} as const satisfies Record<string, string>;

export const CANONICAL_FROM_NAME = "HENRY’S" as const;
export const CANONICAL_FROM_EMAIL = `${CANONICAL_FROM_NAME} <${EMAIL_CONTACTS.support}>`;
export const CANONICAL_REPLY_TO = EMAIL_CONTACTS.support;

const EMAIL_ENV_VARS = [
  "AUTH_EMAIL_FROM",
  "RESEND_FROM_EMAIL",
  "SMTP_FROM_EMAIL",
  "RESEND_REPLY_TO_EMAIL",
] as const;

function extractDomain(value: string | undefined | null) {
  if (!value) return null;
  const match = value.match(/([A-Z0-9._%+-]+)@([A-Z0-9.-]+)/i);
  return match ? match[2].toLowerCase() : null;
}

export function assertCanonicalEmailEnv(
  logger: Pick<Console, "warn"> = console,
) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const mismatched = EMAIL_ENV_VARS.flatMap((envVar) => {
    const rawValue = process.env[envVar];
    if (!rawValue) return [];
    const domain = extractDomain(rawValue);
    if (!domain || domain === EMAIL_DOMAIN) {
      return [];
    }

    return [
      `${envVar} uses non-canonical domain "${domain}" (expected ${EMAIL_DOMAIN})`,
    ];
  });

  if (mismatched.length > 0) {
    logger.warn(
      [
        "[email-config] Non-canonical email configuration detected.",
        ...mismatched,
        "Update the environment variables above to use the official domain.",
      ].join("\n"),
    );
  }
}

if (process.env.NODE_ENV === "production") {
  assertCanonicalEmailEnv();
}
