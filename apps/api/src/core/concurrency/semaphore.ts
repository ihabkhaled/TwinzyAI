import { ConcurrencyAbortError, ConcurrencyTimeoutError } from './concurrency.errors';
import type {
  SemaphoreAcquireOptions,
  SemaphoreRelease,
  SemaphoreWaiter,
} from './concurrency.types';

/**
 * A minimal counting semaphore for bounding concurrent async work inside one
 * process. `acquire` resolves with a `release` function once a permit is free;
 * callers over the limit wait in a FIFO queue and may be released early by an
 * AbortSignal or a wait timeout. It is the single reusable concurrency
 * primitive behind the AI step gate (a long-lived per-step permit pool) — a
 * distinct concern from {@link ConcurrencyLimiter}, which is whole-analysis
 * admission control (global / per-IP / per-tab).
 *
 * Single-process and in-memory by design: it bounds one API instance. Sizing
 * the whole fleet is a horizontal-scaling concern documented separately.
 */
export class Semaphore {
  private available: number;

  private readonly waiters: SemaphoreWaiter[] = [];

  public constructor(permits: number) {
    this.available = Math.max(0, Math.floor(permits));
  }

  /** Permits currently free (not held and not promised to a queued waiter). */
  public get availablePermits(): number {
    return this.available;
  }

  /** Acquirers currently waiting in the FIFO queue for a permit. */
  public get pendingCount(): number {
    return this.waiters.length;
  }

  /**
   * Reserve a permit. Resolves immediately with a `release` when one is free,
   * otherwise queues until a permit frees, the signal aborts, or the wait
   * budget elapses. A rejected acquire never holds a permit.
   */
  public acquire(options?: SemaphoreAcquireOptions): Promise<SemaphoreRelease> {
    const signal = options?.signal;
    if (signal?.aborted === true) {
      return Promise.reject(this.abortReason(signal));
    }
    if (this.available > 0) {
      this.available -= 1;
      return Promise.resolve(this.buildRelease());
    }
    return this.enqueue(options?.timeoutMs, signal);
  }

  private enqueue(timeoutMs?: number, signal?: AbortSignal): Promise<SemaphoreRelease> {
    return new Promise<SemaphoreRelease>((resolve, reject) => {
      const waiter: SemaphoreWaiter = {
        resolve,
        reject,
        signal,
        settled: false,
        abortListener: (): void => {
          this.settle(waiter, () => {
            reject(this.abortReason(signal));
          });
        },
        timer:
          timeoutMs === undefined
            ? undefined
            : setTimeout(() => {
                this.settle(waiter, () => {
                  reject(new ConcurrencyTimeoutError());
                });
              }, timeoutMs),
      };
      waiter.timer?.unref();
      this.waiters.push(waiter);
      signal?.addEventListener('abort', waiter.abortListener, { once: true });
    });
  }

  private buildRelease(): SemaphoreRelease {
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.available += 1;
      this.drain();
    };
  }

  /** Grant the freed permit to the oldest still-waiting acquirer, FIFO. */
  private drain(): void {
    while (this.available > 0) {
      const waiter = this.waiters.find((candidate) => !candidate.settled);
      if (waiter === undefined) {
        return;
      }
      this.available -= 1;
      this.settle(waiter, () => {
        waiter.resolve(this.buildRelease());
      });
    }
  }

  private settle(waiter: SemaphoreWaiter, deliver: () => void): void {
    if (waiter.settled) {
      return;
    }
    waiter.settled = true;
    if (waiter.timer !== undefined) {
      clearTimeout(waiter.timer);
    }
    waiter.signal?.removeEventListener('abort', waiter.abortListener);
    const index = this.waiters.indexOf(waiter);
    if (index !== -1) {
      this.waiters.splice(index, 1);
    }
    deliver();
  }

  private abortReason(signal: AbortSignal | undefined): Error {
    const reason: unknown = signal?.reason;
    return reason instanceof Error ? reason : new ConcurrencyAbortError();
  }
}
