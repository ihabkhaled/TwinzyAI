/**
 * Canonical numeric bounds and defaults for the environment schema. Centralized
 * here so the config schema, tests, and docs share the same numbers.
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

export const MIN_IMAGE_SIZE_BYTES = 1024;
export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5_242_880;

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
