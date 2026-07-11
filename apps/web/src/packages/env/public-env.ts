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

/** Treat an unset OR empty-string env value as "feature off" (link hidden). */
const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

export const publicEnvSchema = z.object({
  appEnv: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  apiBaseUrl: z.url().default('http://localhost:4000'),
  paypalMeUsername: z.preprocess(
    emptyToUndefined,
    z.string().regex(PAYPAL_ME_USERNAME_PATTERN).optional(),
  ),
});

export type PublicEnv = z.output<typeof publicEnvSchema>;

export const publicEnv: PublicEnv = parseSchema(
  publicEnvSchema,
  {
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    paypalMeUsername: process.env.NEXT_PUBLIC_PAYPAL_ME_USERNAME,
  },
  'public environment',
);

/**
 * True when running under the  server (React Refresh, eval'd
 * chunks). Keyed on NODE_ENV — the RUNTIME — deliberately, not on appEnv:
 * e2e runs the dev server with appEnv=test and still needs dev allowances.
 */
export const isDevRuntime = process.env.NODE_ENV === 'development';
