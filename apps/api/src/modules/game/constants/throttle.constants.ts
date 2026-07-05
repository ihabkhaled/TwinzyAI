/**
 * Stricter per-route limit for the expensive analyze pipeline:
 * 10 requests per minute per client (global default is 30/min).
 */
export const ANALYZE_THROTTLE = {
  default: { limit: 10, ttl: 60_000 },
} as const;
