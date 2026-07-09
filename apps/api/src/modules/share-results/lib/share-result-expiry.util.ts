import { MILLISECONDS_PER_SECOND } from '../model/share-result.constants';
import type { ShareExpiryWindow } from '../model/share-result.types';

/** Derives the created/expiry window for a new record from the server clock. */
export const computeShareExpiry = (nowMs: number, ttlSeconds: number): ShareExpiryWindow => ({
  createdAtMs: nowMs,
  expiresAtMs: nowMs + ttlSeconds * MILLISECONDS_PER_SECOND,
});

/** True once the record has reached (or passed) its expiry instant. */
export const isShareExpired = (expiresAtMs: number, nowMs: number): boolean => nowMs >= expiresAtMs;

/**
 * Whole seconds left before expiry, never negative. Rounded UP so a record
 * with 0.4s left still reports 1 — the countdown reaches 0 exactly at expiry,
 * not a tick early.
 */
export const shareRemainingSeconds = (expiresAtMs: number, nowMs: number): number =>
  Math.max(0, Math.ceil((expiresAtMs - nowMs) / MILLISECONDS_PER_SECOND));
