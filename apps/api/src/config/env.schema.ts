import { z } from 'zod';

import {
  DEFAULT_AI_CALLS_PER_ANALYSIS,
  DEFAULT_AI_GENERATION_CONCURRENCY,
  DEFAULT_AI_GENERATION_LANES,
  DEFAULT_AI_JUDGE_CONCURRENCY,
  DEFAULT_AI_PARALLEL_QUEUE_TIMEOUT_MS,
  DEFAULT_AI_RESPONSE_BYTES,
  DEFAULT_ANALYSIS_TIMEOUT_MS,
  DEFAULT_API_PORT,
  DEFAULT_CLAMAV_HOSTS,
  DEFAULT_CLAMAV_PORT,
  DEFAULT_CORS_ORIGIN,
  DEFAULT_GEMINI_STREAM_IDLE_TIMEOUT_MS,
  DEFAULT_GEMINI_TIMEOUT_MS,
  DEFAULT_MAX_ACTIVE_ANALYSES_PER_IP,
  DEFAULT_MAX_ACTIVE_ANALYSES_PER_TAB,
  DEFAULT_MAX_ANALYSIS_QUEUE_SIZE,
  DEFAULT_MAX_GLOBAL_ACTIVE_ANALYSES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_TTL_MS,
  DEFAULT_SHARE_RESULT_MAX_ACTIVE_ITEMS,
  DEFAULT_SHARE_RESULT_MAX_PAYLOAD_BYTES,
  DEFAULT_SHARE_RESULT_PUBLIC_BASE_URL,
  DEFAULT_SHARE_RESULT_TTL_SECONDS,
  DEFAULT_STREAM_TTL_MS,
  MAX_ACTIVE_ANALYSES_PER_IP_LIMIT,
  MAX_ACTIVE_ANALYSES_PER_TAB_LIMIT,
  MAX_AI_CALLS_PER_ANALYSIS,
  MAX_AI_GENERATION_LANES,
  MAX_AI_PARALLEL_QUEUE_TIMEOUT_MS,
  MAX_AI_RESPONSE_BYTES,
  MAX_AI_STEP_CONCURRENCY,
  MAX_ANALYSIS_TIMEOUT_MS,
  MAX_GEMINI_STREAM_IDLE_TIMEOUT_MS,
  MAX_GEMINI_TIMEOUT_MS,
  MAX_GLOBAL_ACTIVE_ANALYSES_LIMIT,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PORT_NUMBER,
  MAX_QUEUE_SIZE,
  MAX_RATE_LIMIT_MAX,
  MAX_RATE_LIMIT_TTL_MS,
  MAX_SHARE_RESULT_MAX_ACTIVE_ITEMS,
  MAX_SHARE_RESULT_MAX_PAYLOAD_BYTES,
  MAX_SHARE_RESULT_TTL_SECONDS,
  MAX_STREAM_TTL_MS,
  MIN_AI_CALLS_PER_ANALYSIS,
  MIN_AI_GENERATION_LANES,
  MIN_AI_PARALLEL_QUEUE_TIMEOUT_MS,
  MIN_AI_RESPONSE_BYTES,
  MIN_AI_STEP_CONCURRENCY,
  MIN_ANALYSIS_TIMEOUT_MS,
  MIN_CONCURRENCY_LIMIT,
  MIN_GEMINI_STREAM_IDLE_TIMEOUT_MS,
  MIN_GEMINI_TIMEOUT_MS,
  MIN_IMAGE_SIZE_BYTES,
  MIN_PORT_NUMBER,
  MIN_QUEUE_SIZE,
  MIN_RATE_LIMIT_MAX,
  MIN_RATE_LIMIT_TTL_MS,
  MIN_SHARE_RESULT_MAX_ACTIVE_ITEMS,
  MIN_SHARE_RESULT_MAX_PAYLOAD_BYTES,
  MIN_SHARE_RESULT_TTL_SECONDS,
  MIN_STREAM_TTL_MS,
  PAYMENT_PRICE_CURRENCY_PATTERN,
  PAYMENT_PRICE_VALUE_PATTERN,
} from './env-bounds.constants';
import { PAYPAL_ENV_VALUES } from './payment.constants';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type LogLevelValue = (typeof LOG_LEVELS)[number];

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

/**
 * Tri-state boolean flag: stays undefined when the variable is absent so the
 * config service can apply an environment-dependent default.
 */
const optionalBooleanFromString = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

/**
 * Single source of truth for every environment variable the API reads.
 * Nothing outside the config module may touch process.env.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    API_PORT: z.coerce
      .number()
      .int()
      .min(MIN_PORT_NUMBER)
      .max(MAX_PORT_NUMBER)
      .default(DEFAULT_API_PORT),
    CORS_ALLOWED_ORIGINS: z.string().default(DEFAULT_CORS_ORIGIN),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    ENABLE_SWAGGER: optionalBooleanFromString,
    RATE_LIMIT_TTL_MS: z.coerce
      .number()
      .int()
      .min(MIN_RATE_LIMIT_TTL_MS)
      .max(MAX_RATE_LIMIT_TTL_MS)
      .default(DEFAULT_RATE_LIMIT_TTL_MS),
    RATE_LIMIT_MAX: z.coerce
      .number()
      .int()
      .min(MIN_RATE_LIMIT_MAX)
      .max(MAX_RATE_LIMIT_MAX)
      .default(DEFAULT_RATE_LIMIT_MAX),
    GEMINI_API_KEY: z.string().default(''),
    /**
     * PayPal REST credentials. BOTH present ⇒ the paid-analysis gate is ON;
     * either empty ⇒ the game is free and no payment code path executes.
     */
    PAYPAL_CLIENT_ID: z.string().default(''),
    PAYPAL_CLIENT_SECRET: z.string().default(''),
    PAYPAL_ENV: z.enum(PAYPAL_ENV_VALUES).default('sandbox'),
    /** Server-authoritative price per analysis (never trusted from clients). */
    PAYMENT_PRICE_VALUE: z.string().regex(PAYMENT_PRICE_VALUE_PATTERN).default('0.50'),
    PAYMENT_PRICE_CURRENCY: z.string().regex(PAYMENT_PRICE_CURRENCY_PATTERN).default('USD'),
    GEMINI_MODEL: z.string().default(''),
    // Comma-separated ordered fallback model ids. If the primary GEMINI_MODEL is
    // rate-limited (429), overloaded, or unavailable, the adapter retries the
    // same call down this list before giving up — so one model's quota does not
    // take the game down.
    GEMINI_FALLBACK_MODELS: z.string().default(''),
    // Optional PER-STEP model chains. Each pipeline step (trait extraction,
    // candidate generation, judging, result translation) may pin its own primary
    // + fallbacks so the hardest steps run on the strongest models while cheap
    // mechanical steps (translation) run on the fastest/cheapest. Semantics: a
    // step's chain is exactly what its two vars configure; when BOTH are empty
    // the step uses the global GEMINI_MODEL/GEMINI_FALLBACK_MODELS chain.
    GEMINI_MODEL_EXTRACTION: z.string().default(''),
    GEMINI_FALLBACK_MODELS_EXTRACTION: z.string().default(''),
    GEMINI_MODEL_GENERATION: z.string().default(''),
    GEMINI_FALLBACK_MODELS_GENERATION: z.string().default(''),
    GEMINI_MODEL_JUDGE: z.string().default(''),
    GEMINI_FALLBACK_MODELS_JUDGE: z.string().default(''),
    GEMINI_MODEL_TRANSLATION: z.string().default(''),
    GEMINI_FALLBACK_MODELS_TRANSLATION: z.string().default(''),
    // MULTI-PROVIDER ROUTES. Each is a comma-separated ordered chain of
    // `provider:model` tokens (bare model = gemini:<model> for back-compat).
    // When set, a step's route REPLACES its GEMINI_* chain; when empty, the
    // GEMINI_* per-step chain (then the global chain) applies — so a
    // Gemini-only configuration remains a fully valid production setup.
    AI_ROUTE_EXTRACTION: z.string().default(''),
    AI_ROUTE_GENERATION: z.string().default(''),
    AI_ROUTE_JUDGE: z.string().default(''),
    AI_ROUTE_TRANSLATION: z.string().default(''),
    // Vision capability declarations for NON-Gemini entries, comma-separated
    // `provider:model` tokens. FAIL-CLOSED: an image-carrying step may only be
    // routed to gemini models (multimodal incumbents) or to entries explicitly
    // declared here — a photo can never reach a provider the operator did not
    // consciously allow to receive images.
    // OpenAI-compatible provider credentials + base-URL overrides. A provider is
    // ENABLED iff its API key is non-empty (key presence is the enable flag).
    OPENAI_API_KEY: z.string().default(''),
    OPENAI_BASE_URL: z.string().default(''),
    DEEPSEEK_API_KEY: z.string().default(''),
    DEEPSEEK_BASE_URL: z.string().default(''),
    QWEN_API_KEY: z.string().default(''),
    QWEN_BASE_URL: z.string().default(''),
    KIMI_API_KEY: z.string().default(''),
    KIMI_BASE_URL: z.string().default(''),
    GLM_API_KEY: z.string().default(''),
    GLM_BASE_URL: z.string().default(''),
    // SHADOW MODE: sampled, metrics-only comparison runs that never affect the
    // user-visible result. Off by default; sample rate bounds cost.
    AI_SHADOW_ENABLED: booleanFromString,
    AI_SHADOW_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
    AI_SHADOW_ROUTE_GENERATION: z.string().default(''),
    AI_SHADOW_ROUTE_JUDGE: z.string().default(''),
    AI_SHADOW_ROUTE_TRANSLATION: z.string().default(''),
    // Extraction is never shadowed; shadow mode is text-only.
    AI_SHADOW_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(MIN_GEMINI_TIMEOUT_MS)
      .max(MAX_GEMINI_TIMEOUT_MS)
      .default(DEFAULT_GEMINI_TIMEOUT_MS),
    GEMINI_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(MIN_GEMINI_TIMEOUT_MS)
      .max(MAX_GEMINI_TIMEOUT_MS)
      .default(DEFAULT_GEMINI_TIMEOUT_MS),
    // Idle (inter-chunk) timeout for streaming Gemini calls. The stream is only
    // aborted after this long with NO new token — as long as the model keeps
    // producing output the call is never cut off, so the pipeline "listens and
    // waits" instead of racing a fixed total deadline.
    GEMINI_STREAM_IDLE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(MIN_GEMINI_STREAM_IDLE_TIMEOUT_MS)
      .max(MAX_GEMINI_STREAM_IDLE_TIMEOUT_MS)
      .default(DEFAULT_GEMINI_STREAM_IDLE_TIMEOUT_MS),
    AI_MAX_RESPONSE_BYTES: z.coerce
      .number()
      .int()
      .min(MIN_AI_RESPONSE_BYTES)
      .max(MAX_AI_RESPONSE_BYTES)
      .default(DEFAULT_AI_RESPONSE_BYTES),
    // PARALLEL AI PIPELINE (Release A — async candidate-generation lanes).
    // OFF by default: when false the pipeline runs the unchanged single
    // generation call. When true, candidate recall fans out into
    // AI_GENERATION_LANES text-only lanes (each a different recall focus),
    // bounded globally by AI_GENERATION_CONCURRENCY concurrent generation
    // calls, never exceeding AI_MAX_CALLS_PER_ANALYSIS provider calls per
    // analysis. A lane that cannot get a concurrency permit within
    // AI_PARALLEL_QUEUE_TIMEOUT_MS is dropped, not blocked. Extraction still
    // runs once (image-only) and judging still runs once; parallelism never
    // widens the image boundary. AI_JUDGE_CONCURRENCY provisions the judge
    // gate for the Release B judge tournament.
    AI_PARALLEL_PIPELINE_ENABLED: booleanFromString,
    AI_GENERATION_LANES: z.coerce
      .number()
      .int()
      .min(MIN_AI_GENERATION_LANES)
      .max(MAX_AI_GENERATION_LANES)
      .default(DEFAULT_AI_GENERATION_LANES),
    AI_GENERATION_CONCURRENCY: z.coerce
      .number()
      .int()
      .min(MIN_AI_STEP_CONCURRENCY)
      .max(MAX_AI_STEP_CONCURRENCY)
      .default(DEFAULT_AI_GENERATION_CONCURRENCY),
    AI_JUDGE_CONCURRENCY: z.coerce
      .number()
      .int()
      .min(MIN_AI_STEP_CONCURRENCY)
      .max(MAX_AI_STEP_CONCURRENCY)
      .default(DEFAULT_AI_JUDGE_CONCURRENCY),
    AI_MAX_CALLS_PER_ANALYSIS: z.coerce
      .number()
      .int()
      .min(MIN_AI_CALLS_PER_ANALYSIS)
      .max(MAX_AI_CALLS_PER_ANALYSIS)
      .default(DEFAULT_AI_CALLS_PER_ANALYSIS),
    AI_PARALLEL_QUEUE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(MIN_AI_PARALLEL_QUEUE_TIMEOUT_MS)
      .max(MAX_AI_PARALLEL_QUEUE_TIMEOUT_MS)
      .default(DEFAULT_AI_PARALLEL_QUEUE_TIMEOUT_MS),
    MAX_IMAGE_SIZE_BYTES: z.coerce
      .number()
      .int()
      .min(MIN_IMAGE_SIZE_BYTES)
      .max(MAX_IMAGE_SIZE_BYTES)
      .default(DEFAULT_MAX_IMAGE_SIZE_BYTES),
    ENABLE_CLAMAV: booleanFromString,
    // Comma-separated ordered clamd hosts. The adapter tries each in turn and
    // caches the first reachable one, so the same config works whether the API
    // runs inside the docker-compose network (`clamav`) or on the host
    // (`127.0.0.1`) against a published clamd port — no hardcoded fallback list.
    CLAMAV_HOSTS: z.string().default(DEFAULT_CLAMAV_HOSTS),
    CLAMAV_PORT: z.coerce
      .number()
      .int()
      .min(MIN_PORT_NUMBER)
      .max(MAX_PORT_NUMBER)
      .default(DEFAULT_CLAMAV_PORT),
    // Hard caps on concurrent streaming analyses. A burst (many tabs, a bot, or a
    // slow provider holding connections) can never exhaust memory or the model
    // quota: runs over capacity queue up to MAX_ANALYSIS_QUEUE_SIZE, then are
    // rejected in-band with SERVER_BUSY. Caps apply globally, per client IP, and
    // per browser tab.
    MAX_GLOBAL_ACTIVE_ANALYSES: z.coerce
      .number()
      .int()
      .min(MIN_CONCURRENCY_LIMIT)
      .max(MAX_GLOBAL_ACTIVE_ANALYSES_LIMIT)
      .default(DEFAULT_MAX_GLOBAL_ACTIVE_ANALYSES),
    MAX_ACTIVE_ANALYSES_PER_IP: z.coerce
      .number()
      .int()
      .min(MIN_CONCURRENCY_LIMIT)
      .max(MAX_ACTIVE_ANALYSES_PER_IP_LIMIT)
      .default(DEFAULT_MAX_ACTIVE_ANALYSES_PER_IP),
    MAX_ACTIVE_ANALYSES_PER_TAB: z.coerce
      .number()
      .int()
      .min(MIN_CONCURRENCY_LIMIT)
      .max(MAX_ACTIVE_ANALYSES_PER_TAB_LIMIT)
      .default(DEFAULT_MAX_ACTIVE_ANALYSES_PER_TAB),
    MAX_ANALYSIS_QUEUE_SIZE: z.coerce
      .number()
      .int()
      .min(MIN_QUEUE_SIZE)
      .max(MAX_QUEUE_SIZE)
      .default(DEFAULT_MAX_ANALYSIS_QUEUE_SIZE),
    // Watchdog: an analysis (and a queued waiter) may not run/wait longer than
    // this before it is aborted and its slot freed — a stuck provider call can
    // never hold a slot forever.
    ANALYSIS_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(MIN_ANALYSIS_TIMEOUT_MS)
      .max(MAX_ANALYSIS_TIMEOUT_MS)
      .default(DEFAULT_ANALYSIS_TIMEOUT_MS),
    // How long an orphaned stream-registry entry survives before the sweeper
    // aborts and reclaims it (safety net for the rare entry the terminal cleanup
    // missed). Keep it above ANALYSIS_TIMEOUT_MS so healthy runs finish first.
    STREAM_TTL_MS: z.coerce
      .number()
      .int()
      .min(MIN_STREAM_TTL_MS)
      .max(MAX_STREAM_TTL_MS)
      .default(DEFAULT_STREAM_TTL_MS),
    // --- Temporary shareable-result cache (no database; TTL-only) ---
    // How long a shared result stays reachable by its UUID link before the cache
    // expires it. Default 10 minutes; the record is unreachable the instant it
    // expires and is never persisted anywhere.
    SHARE_RESULT_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(MIN_SHARE_RESULT_TTL_SECONDS)
      .max(MAX_SHARE_RESULT_TTL_SECONDS)
      .default(DEFAULT_SHARE_RESULT_TTL_SECONDS),
    // Cache backend. `memory` is a bounded in-memory TTL cache (single instance).
    // Redis/Valkey is the documented production path; it is a deliberate code
    // change, so `memory` is the only selectable value today.
    // Hard cap on the stored result JSON size — bounds per-record memory so an
    // oversized payload can never inflate the cache.
    SHARE_RESULT_MAX_PAYLOAD_BYTES: z.coerce
      .number()
      .int()
      .min(MIN_SHARE_RESULT_MAX_PAYLOAD_BYTES)
      .max(MAX_SHARE_RESULT_MAX_PAYLOAD_BYTES)
      .default(DEFAULT_SHARE_RESULT_MAX_PAYLOAD_BYTES),
    // Cap on concurrently-active share records — bounds total cache memory; new
    // creates are rejected (after expired-record cleanup) once the cap is hit.
    SHARE_RESULT_MAX_ACTIVE_ITEMS: z.coerce
      .number()
      .int()
      .min(MIN_SHARE_RESULT_MAX_ACTIVE_ITEMS)
      .max(MAX_SHARE_RESULT_MAX_ACTIVE_ITEMS)
      .default(DEFAULT_SHARE_RESULT_MAX_ACTIVE_ITEMS),
    // Public web origin used to build the shareable `/share/<uuid>` URL. Server
    // config only — never user input — so the link can never be attacker-shaped.
    SHARE_RESULT_PUBLIC_BASE_URL: z.url().default(DEFAULT_SHARE_RESULT_PUBLIC_BASE_URL),
  })
  .superRefine((env, context) => {
    if (env.STREAM_TTL_MS < env.ANALYSIS_TIMEOUT_MS) {
      context.addIssue({
        code: 'custom',
        path: ['STREAM_TTL_MS'],
        message: 'STREAM_TTL_MS must be greater than or equal to ANALYSIS_TIMEOUT_MS',
      });
    }
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
