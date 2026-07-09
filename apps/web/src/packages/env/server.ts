import { parseSchema, z } from '@/packages/zod';

import 'server-only';

/**
 * Server-only environment facade. The `server-only` import guarantees this
 * module (and the secrets it may read) can never be pulled into a client
 * bundle. Values are validated once and cached for the process lifetime.
 */
const serverEnvSchema = z.object({
  apiBaseUrl: z.url().default('http://localhost:4000'),
});

type ServerEnv = z.output<typeof serverEnvSchema>;

const serverEnvCache: { value: ServerEnv | null } = { value: null };

export function getServerEnv(): ServerEnv {
  serverEnvCache.value ??= parseSchema(
    serverEnvSchema,
    { apiBaseUrl: process.env['SERVER_API_BASE_URL'] },
    'server environment',
  );

  return serverEnvCache.value;
}
