import { parseSchema, z } from '@/packages/zod';

/**
 * Public runtime configuration exposed to the browser. Values come from the
 * statically inlined `NEXT_PUBLIC_*` variables (dot-access so Next replaces
 * them at build time) and are validated once here — a missing or malformed
 * value fails fast at module load instead of surfacing as `undefined` deep
 * inside a feature. This module is the ONLY sanctioned reader of `process.env`
 * on the client side.
 */
/**
 * PayPal.me handles are strictly alphanumeric. The pattern is the security
 * boundary for the donate link: the handle is interpolated into an outbound
 * URL, so anything that could alter the path or origin (slashes, dots, `@`,
 * percent-escapes, whitespace) must fail the build/boot instead of shipping.
 */
export const PAYPAL_ME_USERNAME_PATTERN = /^[A-Z0-9]{1,50}$/i;

/** PayPal REST client ids are URL-safe base64-ish tokens; bound charset + length. */
export const PAYPAL_CLIENT_ID_PATTERN = /^[\w-]{20,120}$/;

/** Paymob public keys (e.g. egy_pk_test_…): word chars only; bound charset + length. */
const PAYMOB_PUBLIC_KEY_PATTERN = /^[\w-]{20,120}$/;

/**
 * AdSense publisher ids are the literal `ca-pub-` prefix plus digits. The
 * pattern is the security boundary for the ad tag: the id is interpolated into
 * the loader's query string, so anything that could alter the URL must fail the
 * build instead of shipping.
 */
const ADSENSE_CLIENT_ID_PATTERN = /^ca-pub-\d{10,20}$/;

/** Treat an unset OR empty-string env value as "feature off" (link hidden). */
const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

export const publicEnvSchema = z.object({
  appEnv: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  apiBaseUrl: z.url().default('http://localhost:4000'),
  paypalMeUsername: z.preprocess(
    emptyToUndefined,
    z.string().regex(PAYPAL_ME_USERNAME_PATTERN).optional(),
  ),
  // Public PayPal client id for the browser Buttons SDK (safe to expose).
  // Charset-bounded so it can only ever be a query-param value, never markup.
  paypalClientId: z.preprocess(
    emptyToUndefined,
    z.string().regex(PAYPAL_CLIENT_ID_PATTERN).optional(),
  ),
  // Public Paymob key for the browser unified-checkout popup (safe to expose).
  // Presence gates the "Pay with card" option; the intention response also
  // returns the key, so this is only the client-side visibility switch.
  paymobPublicKey: z.preprocess(
    emptyToUndefined,
    z.string().regex(PAYMOB_PUBLIC_KEY_PATTERN).optional(),
  ),
  // Display-only price shown on the payment step. MUST mirror the server's
  // PAYMENT_PRICE_VALUE/CURRENCY (the server price is authoritative and every
  // capture is verified against it); these only format the copy the buyer reads.
  paymentPriceValue: z
    .string()
    .regex(/^\d{1,6}\.\d{2}$/)
    .default('0.50'),
  paymentPriceCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('USD'),
  // Google AdSense publisher id. Presence is the ad switch: unset (the default)
  // ships no third-party ad script at all.
  adsenseClientId: z.preprocess(
    emptyToUndefined,
    z.string().regex(ADSENSE_CLIENT_ID_PATTERN).optional(),
  ),
});

export type PublicEnv = z.output<typeof publicEnvSchema>;

export const publicEnv: PublicEnv = parseSchema(
  publicEnvSchema,
  {
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    paypalMeUsername: process.env.NEXT_PUBLIC_PAYPAL_ME_USERNAME,
    paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    paymobPublicKey: process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY,
    paymentPriceValue: process.env.NEXT_PUBLIC_PAYMENT_PRICE_VALUE,
    paymentPriceCurrency: process.env.NEXT_PUBLIC_PAYMENT_PRICE_CURRENCY,
    adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  },
  'public environment',
);

/**
 * True when running under the  server (React Refresh, eval'd
 * chunks). Keyed on NODE_ENV — the RUNTIME — deliberately, not on appEnv:
 * e2e runs the dev server with appEnv=test and still needs dev allowances.
 */
export const isDevRuntime = process.env.NODE_ENV === 'development';
