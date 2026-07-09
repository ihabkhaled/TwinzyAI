/**
 * Supported share-result cache drivers. `memory` is the built, tested driver
 * (bounded in-memory TTL cache) for single-instance / local deployments.
 * Redis/Valkey is the documented production extension of the same cache port;
 * it is intentionally NOT a built-in driver value here so an operator can never
 * select an unimplemented backend and fail closed at runtime — enabling it is a
 * deliberate code change (add the adapter, then add the value). See
 * docs/architecture.md and docs/privacy-and-data-retention.md.
 */
export const SHARE_CACHE_DRIVERS = ['memory'] as const;

export type ShareCacheDriverValue = (typeof SHARE_CACHE_DRIVERS)[number];
