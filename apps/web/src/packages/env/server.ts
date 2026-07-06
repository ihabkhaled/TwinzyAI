import 'server-only';

import { parseSchema, z } from '@/packages/zod';

/**
 * Server-only environment facade. The `server-only` import guarantees this
 * module (and the secrets it may read) can never be pulled into a client
 * bundle. Values are validated once and cached for the process lifetime.
 */
const serverEnvSchema = z.object({
  apiBaseUrl: z.url().default('http://localhost:4000'),
});

type ServerEnv = z.output<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseSchema(
    serverEnvSchema,
    { apiBaseUrl: process.env['SERVER_API_BASE_URL'] },
    'server environment',
  );

  return cachedServerEnv;
}
