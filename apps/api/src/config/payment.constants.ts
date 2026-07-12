/**
 * Payment-configuration domain types + the PayPal REST base URL per
 * environment. The paid-analysis gate is env-driven end to end: credentials
 * enable it, PAYPAL_ENV picks the endpoint, and the price is server-owned.
 */

const PaypalEnv = {
  Sandbox: 'sandbox',
  Live: 'live',
} as const;

export type PaypalEnvValue = (typeof PaypalEnv)[keyof typeof PaypalEnv];

/** The env-schema's source of truth for the `PAYPAL_ENV` enum. */
export const PAYPAL_ENV_VALUES = [PaypalEnv.Sandbox, PaypalEnv.Live] as const;

/** REST API origin per PayPal environment (never configurable per-request). */
export const PAYPAL_BASE_URL_BY_ENV: Record<PaypalEnvValue, string> = {
  [PaypalEnv.Sandbox]: 'https://api-m.sandbox.paypal.com',
  [PaypalEnv.Live]: 'https://api-m.paypal.com',
};

/** Server-authoritative price of one analysis run. */
export interface PaymentPrice {
  readonly value: string;
  readonly currencyCode: string;
}
