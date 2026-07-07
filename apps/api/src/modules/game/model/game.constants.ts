/**
 * Stricter per-route limit for the expensive analyze pipeline:
 * 10 requests per minute per client (global default is 30/min).
 */
export const ANALYZE_THROTTLE = {
  default: { limit: 10, ttl: 60_000 },
} as const;

/**
 * Per-route limit for the text-only translation endpoint. Cheaper than
 * analyze but still a model call — 10 per minute per client.
 */
export const TRANSLATE_THROTTLE = {
  default: { limit: 10, ttl: 60_000 },
} as const;

/** Multipart field name carrying the single uploaded image. */
export const UPLOAD_FIELD_NAME = 'image';

/**
 * Hard transport-level cap (10 MB) — a backstop above the configured
 * business limit (5 MB default) so oversized bodies are cut early while
 * the FileSecurityService still produces the friendly FILE_TOO_LARGE error
 * for anything between the two. Enforced by the multipart plugin registered
 * in src/bootstrap (memory only: the image never touches disk).
 */
export const UPLOAD_HARD_CAP_BYTES = 10_485_760;

/** Exactly one file per request; extras are rejected at the transport edge. */
export const UPLOAD_MAX_FILES = 1;
