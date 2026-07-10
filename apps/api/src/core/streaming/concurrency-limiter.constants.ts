import type { AcquireOutcome } from './concurrency-limiter.types';

/** Shared rejection outcome for full, timed-out, or cancelled admission. */
export const BUSY_ACQUIRE_OUTCOME: AcquireOutcome = { granted: false };
