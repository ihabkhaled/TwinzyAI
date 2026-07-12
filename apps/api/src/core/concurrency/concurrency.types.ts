/** Frees one permit back to the semaphore. Idempotent: safe to call once. */
export type SemaphoreRelease = () => void;

/** Optional cancellation + wait-budget controls for a single acquire attempt. */
export interface SemaphoreAcquireOptions {
  /** Aborts the wait (and rejects the acquire) when it fires. */
  readonly signal?: AbortSignal | undefined;
  /** Rejects the acquire if a permit is not granted within this many ms. */
  readonly timeoutMs?: number | undefined;
}

/** One queued acquirer waiting for a permit, including its cancellation cleanup. */
export interface SemaphoreWaiter {
  readonly resolve: (release: SemaphoreRelease) => void;
  readonly reject: (reason: Error) => void;
  readonly signal: AbortSignal | undefined;
  readonly abortListener: () => void;
  readonly timer: ReturnType<typeof setTimeout> | undefined;
  settled: boolean;
}
