import { parseSchema, z } from '@/packages/zod';

/**
 * Public runtime configuration exposed to the browser. Values come from the
 * statically inlined `NEXT_PUBLIC_*` variables (dot-access so Next replaces
 * them at build time) and are validated once here — a missing or malformed
 * value fails fast at module load instead of surfacing as `undefined` deep
 * inside a feature. This module is the ONLY sanctioned reader of `process.env`
 * on the client side.
 */
const publicEnvSchema = z.object({
  appEnv: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  apiBaseUrl: z.url().default('http://localhost:4000'),
});

export type PublicEnv = z.output<typeof publicEnvSchema>;

export const publicEnv: PublicEnv = parseSchema(
  publicEnvSchema,
  {
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  'public environment',
);
