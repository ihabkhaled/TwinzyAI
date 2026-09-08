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

/**
 * Cancel is a cheap in-memory lookup, but still per-client throttled so it
 * cannot be abused to probe the stream registry — 60 per minute per client.
 */
export const CANCEL_THROTTLE = {
  default: { limit: 60, ttl: 60_000 },
} as const;

/**
 * Hard transport-level cap (10 MB) — a backstop above the configured
 * business limit (5 MB default) so oversized bodies are cut early while
 * the FileSecurityService still produces the friendly FILE_TOO_LARGE error
 * for anything between the two. Enforced by the multipart plugin registered
 * in src/bootstrap (memory only: the image never touches disk).
 */
export { UPLOAD_TRANSPORT_HARD_CAP_BYTES as UPLOAD_HARD_CAP_BYTES } from '@twinzy/shared';

/** Exactly one file per request; the parser rejects the second file itself. */
const UPLOAD_MAX_FILES = 1;

/**
 * One slot of headroom above {@link UPLOAD_MAX_FILES} for the transport guard.
 * @fastify/multipart destroys the in-flight file stream the moment its own
 * files limit trips, so the parser would only ever see ERR_STREAM_PREMATURE_CLOSE
 * instead of the extra part — and answer 500 rather than MULTIPLE_FILES_NOT_ALLOWED.
 * With the headroom the second part reaches the parser, which rejects it before
 * buffering a single byte of it; this stays the outer backstop for the rest.
 */
export const UPLOAD_TRANSPORT_MAX_FILES = UPLOAD_MAX_FILES + 1;

/** Transport-level cap on the free-form languageCode multipart field. */
export const LANGUAGE_CODE_MAX_LENGTH = 35;

/**
 * Route segments of the game controller — single-sourced so transport-level
 * per-route protections (the JSON body caps in src/bootstrap) can never drift
 * from the decorators: renaming a route here updates both sides together.
 */
export const GAME_ROUTE_ROOT = 'game';
export const GAME_ROUTE_ANALYZE = 'analyze';
export const GAME_ROUTE_ANALYZE_STREAM = 'analyze/stream';
export const GAME_ROUTE_CANCEL = 'cancel';
export const GAME_ROUTE_TRANSLATE_RESULT = 'translate-result';

/** Interval between keep-alive heartbeats while the pipeline runs. */
export const STREAM_HEARTBEAT_INTERVAL_MS = 10_000;
