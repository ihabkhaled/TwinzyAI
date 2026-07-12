/** Stable name so callers can classify a timed-out acquire without string matching. */
export const CONCURRENCY_TIMEOUT_ERROR_NAME = 'ConcurrencyTimeoutError';

/**
 * Thrown when a semaphore permit is not granted within the caller's wait
 * budget. A distinct type so a fan-out caller can tell "no permit in time"
 * apart from a downstream (e.g. provider) failure when logging lane outcomes.
 */
export class ConcurrencyTimeoutError extends Error {
  public constructor(message = 'Concurrency permit acquisition timed out') {
    super(message);
    this.name = CONCURRENCY_TIMEOUT_ERROR_NAME;
  }
}

/**
 * Rejection used when a queued acquire is cancelled and the abort signal
 * carries no Error reason of its own. A named `Error` subclass (rather than a
 * mutated built-in) so callers see a stable `name: 'AbortError'`.
 */
export class ConcurrencyAbortError extends Error {
  public constructor(message = 'The operation was aborted') {
    super(message);
    this.name = 'AbortError';
  }
}
