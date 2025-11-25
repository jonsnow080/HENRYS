export type StripeWebhookLogEntry = {
  action?: string;
  eventId?: string;
  eventType?: string;
  idempotencyKey?: string | null;
  message: string;
  result?: Record<string, unknown>;
  success?: boolean;
};

export type StripeWebhookLogger = (entry: StripeWebhookLogEntry) => void;

export function createStripeWebhookLogger(base: Partial<StripeWebhookLogEntry> = {}): StripeWebhookLogger {
  return (entry) => {
    const payload = {
      service: "stripe_webhook",
      timestamp: new Date().toISOString(),
      ...base,
      ...entry,
    } satisfies Record<string, unknown>;

    // eslint-disable-next-line no-console
    console.info(JSON.stringify(payload));
  };
}
