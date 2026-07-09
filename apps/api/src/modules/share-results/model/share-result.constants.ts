/**
 * Create is the only write path and mints a cache record — throttled tightly
 * per client (20/min) so nobody can flood the bounded cache.
 */
export const CREATE_SHARE_THROTTLE = {
  default: { limit: 20, ttl: 60_000 },
} as const;

/**
 * Read is a cheap in-memory lookup, but still per-client throttled so the
 * UUID space cannot be brute-force probed — 120/min per client.
 */
export const READ_SHARE_THROTTLE = {
  default: { limit: 120, ttl: 60_000 },
} as const;

/** Delete is an owner-initiated cleanup; throttled like create. */
export const DELETE_SHARE_THROTTLE = {
  default: { limit: 20, ttl: 60_000 },
} as const;

/**
 * How often the in-memory cache sweeps expired records. Lazy expiry already
 * hides expired entries from reads; this bounds memory for records that are
 * never read again after they expire.
 */
export const SHARE_CACHE_SWEEP_INTERVAL_MS = 30_000;

/** Milliseconds per second — for TTL / remaining-time conversions. */
export const MILLISECONDS_PER_SECOND = 1000;
