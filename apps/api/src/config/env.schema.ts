import { z } from 'zod';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type LogLevelValue = (typeof LOG_LEVELS)[number];

const booleanFromString = z
  .string()
  .optional()
  .transform((value) => value === 'true');

/**
 * Tri-state boolean flag: stays undefined when the variable is absent so the
 * config service can apply an environment-dependent default.
 */
const optionalBooleanFromString = z
  .string()
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

/**
 * Single source of truth for every environment variable the API reads.
 * Nothing outside the config module may touch process.env.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  ENABLE_SWAGGER: optionalBooleanFromString,
  RATE_LIMIT_TTL_MS: z.coerce.number().int().min(1000).max(3_600_000).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(30),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default(''),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().min(1024).default(5_242_880),
  ENABLE_CLAMAV: booleanFromString,
  // Primary clamd host tried first. The adapter automatically falls back to the
  // other well-known host (clamav service name / 127.0.0.1) if this one is not
  // reachable, so ClamAV works whether the API runs inside Docker or on the host.
  CLAMAV_HOST: z.string().default('clamav'),
  CLAMAV_PORT: z.coerce.number().int().min(1).max(65_535).default(3310),
});

export type ParsedEnv = z.infer<typeof EnvSchema>;

/**
 * Fail-fast validation hook for the config module: an invalid environment
 * crashes startup with a readable message instead of failing a request later.
 */
export const validateEnv = (raw: Record<string, unknown>): ParsedEnv => {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
};
