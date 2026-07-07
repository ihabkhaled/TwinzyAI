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
  // Comma-separated ordered fallback model ids. If the primary GEMINI_MODEL is
  // rate-limited (429), overloaded, or unavailable, the adapter retries the
  // same call down this list before giving up — so one model's quota does not
  // take the game down.
  GEMINI_FALLBACK_MODELS: z.string().default(''),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
  // Idle (inter-chunk) timeout for streaming Gemini calls. The stream is only
  // aborted after this long with NO new token — as long as the model keeps
  // producing output the call is never cut off, so the pipeline "listens and
  // waits" instead of racing a fixed total deadline.
  GEMINI_STREAM_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300_000).default(60_000),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().min(1024).default(5_242_880),
  ENABLE_CLAMAV: booleanFromString,
  // Comma-separated ordered clamd hosts. The adapter tries each in turn and
  // caches the first reachable one, so the same config works whether the API
  // runs inside the docker-compose network (`clamav`) or on the host
  // (`127.0.0.1`) against a published clamd port — no hardcoded fallback list.
  CLAMAV_HOSTS: z.string().default('127.0.0.1,clamav'),
  CLAMAV_PORT: z.coerce.number().int().min(1).max(65_535).default(3310),
  // Hard caps on concurrent streaming analyses. A burst (many tabs, a bot, or a
  // slow provider holding connections) can never exhaust memory or the model
  // quota: runs over capacity queue up to MAX_ANALYSIS_QUEUE_SIZE, then are
  // rejected in-band with SERVER_BUSY. Caps apply globally, per client IP, and
  // per browser tab.
  MAX_GLOBAL_ACTIVE_ANALYSES: z.coerce.number().int().min(1).max(10_000).default(50),
  MAX_ACTIVE_ANALYSES_PER_IP: z.coerce.number().int().min(1).max(1000).default(3),
  MAX_ACTIVE_ANALYSES_PER_TAB: z.coerce.number().int().min(1).max(100).default(1),
  MAX_ANALYSIS_QUEUE_SIZE: z.coerce.number().int().min(0).max(10_000).default(100),
  // Watchdog: an analysis (and a queued waiter) may not run/wait longer than
  // this before it is aborted and its slot freed — a stuck provider call can
  // never hold a slot forever.
  ANALYSIS_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600_000).default(120_000),
  // How long an orphaned stream-registry entry survives before the sweeper
  // aborts and reclaims it (safety net for the rare entry the terminal cleanup
  // missed). Keep it above ANALYSIS_TIMEOUT_MS so healthy runs finish first.
  STREAM_TTL_MS: z.coerce.number().int().min(1000).max(1_800_000).default(180_000),
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
