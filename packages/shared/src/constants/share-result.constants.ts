/**
 * Cross-side constants for the temporary shareable-result feature. The backend
 * env-bounds and the frontend gateway both read these so the API path, the
 * public page path, and the TTL bounds can never drift between the two sides.
 */

/** Versioned REST base for creating/reading/deleting temporary share records. */
export const SHARE_RESULTS_PATH = '/api/v1/share-results';

/** Public web route prefix for the temporary share page (`/share/<uuid>`). */
export const SHARE_PAGE_PATH_PREFIX = '/share';

/** Builds the public page path for a share id (the id is a generated UUID). */
export const buildSharePagePath = (shareId: string): string =>
  `${SHARE_PAGE_PATH_PREFIX}/${shareId}`;

/** Default time-to-live for a shared result: 10 minutes. */
export const SHARE_RESULT_DEFAULT_TTL_SECONDS = 600;

/** Minimum configurable TTL: 1 minute (short-lived links stay meaningful). */
export const SHARE_RESULT_MIN_TTL_SECONDS = 60;

/** Maximum configurable TTL: 1 hour (temporary by definition — never permanent). */
export const SHARE_RESULT_MAX_TTL_SECONDS = 3600;

/**
 * Default hard cap on the stored result JSON size. A full advanced result is
 * ~12–25 KB; 50 KB leaves headroom while bounding per-record memory so the
 * cache can never be inflated by an oversized payload.
 */
export const SHARE_RESULT_DEFAULT_MAX_PAYLOAD_BYTES = 50_000;

/** Default cap on concurrently-active share records (bounds total memory). */
export const SHARE_RESULT_DEFAULT_MAX_ACTIVE_ITEMS = 1000;
