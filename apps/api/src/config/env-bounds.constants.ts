/**
 * Canonical numeric bounds and defaults for the environment schema. Centralized
 * here so the config schema, tests, and docs share the same numbers. Values
 * that are cross-side contracts (upload size, share-result cache window) are
 * imported from @twinzy/shared and only aliased here, so the backend default
 * and the frontend pre-check can never drift.
 */

export const MIN_PORT_NUMBER = 1;
export const MAX_PORT_NUMBER = 65_535;
export const DEFAULT_API_PORT = 4000;

export const DEFAULT_CORS_ORIGIN = 'http://localhost:3000';

export const MIN_RATE_LIMIT_TTL_MS = 1000;
export const MAX_RATE_LIMIT_TTL_MS = 3_600_000;
export const DEFAULT_RATE_LIMIT_TTL_MS = 60_000;

export const MIN_RATE_LIMIT_MAX = 1;
export const MAX_RATE_LIMIT_MAX = 10_000;
export const DEFAULT_RATE_LIMIT_MAX = 30;

export const MIN_GEMINI_TIMEOUT_MS = 1000;
export const MAX_GEMINI_TIMEOUT_MS = 120_000;
export const DEFAULT_GEMINI_TIMEOUT_MS = 30_000;

export const MIN_GEMINI_STREAM_IDLE_TIMEOUT_MS = 1000;
export const MAX_GEMINI_STREAM_IDLE_TIMEOUT_MS = 300_000;
export const DEFAULT_GEMINI_STREAM_IDLE_TIMEOUT_MS = 60_000;

export const MIN_AI_RESPONSE_BYTES = 1024;
export const MAX_AI_RESPONSE_BYTES = 2_000_000;
export const DEFAULT_AI_RESPONSE_BYTES = 500_000;

export const MIN_IMAGE_SIZE_BYTES = 1024;

/** Cross-side limits keep transport and application validation in sync. */
export {
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  UPLOAD_TRANSPORT_HARD_CAP_BYTES as MAX_IMAGE_SIZE_BYTES,
} from '@twinzy/shared';

export const DEFAULT_CLAMAV_PORT = 3310;
export const DEFAULT_CLAMAV_HOSTS = '127.0.0.1,clamav';

export const MIN_CONCURRENCY_LIMIT = 1;
export const MAX_GLOBAL_ACTIVE_ANALYSES_LIMIT = 10_000;
export const DEFAULT_MAX_GLOBAL_ACTIVE_ANALYSES = 50;

export const MAX_ACTIVE_ANALYSES_PER_IP_LIMIT = 1000;
export const DEFAULT_MAX_ACTIVE_ANALYSES_PER_IP = 3;

export const MAX_ACTIVE_ANALYSES_PER_TAB_LIMIT = 100;
export const DEFAULT_MAX_ACTIVE_ANALYSES_PER_TAB = 1;

export const MIN_QUEUE_SIZE = 0;
export const MAX_QUEUE_SIZE = 10_000;
export const DEFAULT_MAX_ANALYSIS_QUEUE_SIZE = 100;

export const MIN_ANALYSIS_TIMEOUT_MS = 1000;
export const MAX_ANALYSIS_TIMEOUT_MS = 600_000;
export const DEFAULT_ANALYSIS_TIMEOUT_MS = 120_000;

export const MIN_STREAM_TTL_MS = 1000;
export const MAX_STREAM_TTL_MS = 1_800_000;
export const DEFAULT_STREAM_TTL_MS = 180_000;

// --- Temporary shareable-result cache (no database; TTL-only) ---
// TTL window and defaults come straight from the shared cross-side constants
// so the API, the frontend, and the docs agree on one window (10 min default,
// 1 min..1 h). Only the backend-only payload/item BOUNDS are declared here.
export {
  SHARE_RESULT_DEFAULT_MAX_ACTIVE_ITEMS as DEFAULT_SHARE_RESULT_MAX_ACTIVE_ITEMS,
  SHARE_RESULT_DEFAULT_MAX_PAYLOAD_BYTES as DEFAULT_SHARE_RESULT_MAX_PAYLOAD_BYTES,
  SHARE_RESULT_DEFAULT_TTL_SECONDS as DEFAULT_SHARE_RESULT_TTL_SECONDS,
  SHARE_RESULT_MAX_TTL_SECONDS as MAX_SHARE_RESULT_TTL_SECONDS,
  SHARE_RESULT_MIN_TTL_SECONDS as MIN_SHARE_RESULT_TTL_SECONDS,
} from '@twinzy/shared';

export const MIN_SHARE_RESULT_MAX_PAYLOAD_BYTES = 1024;
export const MAX_SHARE_RESULT_MAX_PAYLOAD_BYTES = 500_000;

export const MIN_SHARE_RESULT_MAX_ACTIVE_ITEMS = 1;
export const MAX_SHARE_RESULT_MAX_ACTIVE_ITEMS = 100_000;

// --- Parallel AI pipeline (Release A: async candidate-generation lanes) ---
// Flag-gated and OFF by default. These bound the fan-out so parallelism can
// never turn into an unbounded burst of provider calls: a fixed lane count, a
// global per-step concurrency ceiling, a hard per-analysis call budget, and a
// queue-wait watchdog for a lane that cannot get a concurrency permit in time.
export const MIN_AI_GENERATION_LANES = 1;
export const MAX_AI_GENERATION_LANES = 6;
export const DEFAULT_AI_GENERATION_LANES = 2;

export const MIN_AI_STEP_CONCURRENCY = 1;
export const MAX_AI_STEP_CONCURRENCY = 16;
export const DEFAULT_AI_GENERATION_CONCURRENCY = 2;
export const DEFAULT_AI_JUDGE_CONCURRENCY = 1;

// Total provider calls one analysis may make (extraction + generation lanes +
// judge). The floor of 3 is the minimum viable pipeline: 1 extraction, 1
// generation lane, 1 judge.
export const MIN_AI_CALLS_PER_ANALYSIS = 3;
export const MAX_AI_CALLS_PER_ANALYSIS = 20;
export const DEFAULT_AI_CALLS_PER_ANALYSIS = 5;

export const MIN_AI_PARALLEL_QUEUE_TIMEOUT_MS = 1000;
export const MAX_AI_PARALLEL_QUEUE_TIMEOUT_MS = 120_000;
export const DEFAULT_AI_PARALLEL_QUEUE_TIMEOUT_MS = 30_000;

// --- Paid analysis (PayPal Orders v2; enabled only when credentials exist) ---
/** Money as PayPal expects it: dot-decimal with exactly two places. */
export const PAYMENT_PRICE_VALUE_PATTERN = /^\d{1,6}\.\d{2}$/;

/** ISO-4217 alpha currency code. */
export const PAYMENT_PRICE_CURRENCY_PATTERN = /^[A-Z]{3}$/;

// --- Paymob (card, EGP; enabled only when its credentials exist) ---
/** Paymob integration id: a numeric id copied from the merchant dashboard. */
export const PAYMOB_INTEGRATION_ID_PATTERN = /^\d{1,12}$/;

/** The currency Paymob charges in (Egypt account => EGP). */
export const DEFAULT_PAYMOB_CURRENCY = 'EGP';

// --- USD -> charge-currency exchange rate (used to price the Paymob EGP charge
// from the canonical USD PAYMENT_PRICE_VALUE) ---
/** Free, keyless USD-base rates endpoint; the currency code is appended (…/USD). */
export const DEFAULT_EXCHANGE_RATE_API_BASE_URL = 'https://open.er-api.com/v6/latest';

/** Cache a fetched rate this long so create-intention and verify-at-consumption agree. */
export const MIN_EXCHANGE_RATE_CACHE_TTL_MS = 60_000;
export const MAX_EXCHANGE_RATE_CACHE_TTL_MS = 86_400_000;
export const DEFAULT_EXCHANGE_RATE_CACHE_TTL_MS = 3_600_000;

/** One outbound rate call is bounded so a rate outage cannot hang a payment. */
export const EXCHANGE_RATE_REQUEST_TIMEOUT_MS = 8000;

/** Fallback USD->charge-currency rate used only when the rate API is unreachable. */
export const DEFAULT_USD_TO_EGP_FALLBACK = 50;

export const DEFAULT_SHARE_RESULT_PUBLIC_BASE_URL = 'http://localhost:3000';
