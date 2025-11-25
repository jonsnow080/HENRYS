function stripeDashboardBaseUrl() {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  return secretKey.startsWith("sk_live") ? "https://dashboard.stripe.com" : "https://dashboard.stripe.com/test";
}

export function buildStripeCustomerUrl(customerId: string) {
  return `${stripeDashboardBaseUrl()}/customers/${customerId}`;
}
