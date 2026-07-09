import type { StoredShareRecord } from './share-result.types';

/**
 * DI token for the share-result cache. Consumers depend on this port, never on
 * a concrete cache client, so the in-memory driver can be swapped for a
 * Redis/Valkey adapter (the documented production path) without touching any
 * business code.
 */
export const SHARE_RESULT_CACHE = Symbol('SHARE_RESULT_CACHE');

/**
 * Pure TTL key/value store for share records — no business policy lives here.
 * Implementations MUST:
 * - never return an expired record from {@link get} (lazy expiry),
 * - reclaim expired records automatically (bound memory),
 * - store ONLY the given record (no image, no derivation).
 */
export interface ShareResultCachePort {
  /** Store a record until its own `expiresAtMs`. Overwrites an existing id. */
  set(record: StoredShareRecord): Promise<void>;
  /** Return the live record, or undefined when missing or already expired. */
  get(shareId: string): Promise<StoredShareRecord | undefined>;
  /** Remove a record if present (idempotent). */
  delete(shareId: string): Promise<void>;
  /** Count of currently-live (non-expired) records — for capacity checks. */
  size(): Promise<number>;
}
